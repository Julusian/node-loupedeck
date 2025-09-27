import { EventEmitter } from 'eventemitter3'
import type { LoupedeckDeviceEvents, LoupedeckTouchObject } from '../events.js'
import {
	DisplayCenterEncodedId,
	DisplayLeftEncodedId,
	DisplayMainEncodedId,
	DisplayRightEncodedId,
	DisplayWheelEncodedId,
	LoupedeckDisplayId,
	type LoupedeckBufferFormat,
	type LoupedeckVibratePattern,
	type RGBColor,
} from '../constants.js'
import type { LoupedeckSerialConnection } from '../serial.js'
import { checkRGBColor, checkRGBValue, createCanDrawPixel, encodeBuffer, uint8ArrayToDataView } from '../util.js'
import type { LoupedeckDevice, LoupedeckDisplayDefinition } from './interface.js'
import type { LoupedeckModelId } from '../info.js'
import type { LoupedeckButtonControlDefinition, LoupedeckControlDefinition } from '../controlDefinition.js'
import PQueue from 'p-queue'

enum CommandIds {
	SetColour = 0x02,
	GetSerialNumber = 0x03,
	GetVersion = 0x07,
	SetBrightness = 0x09,
	RefreshDisplay = 0x0f,
	DrawFramebuffer = 0x10,
	SetVibration = 0x1b,

	// CONFIRM: 0x0302,
	// TICK: 0x0400,
	// BUTTON_PRESS: 0x0500,
	// KNOB_ROTATE: 0x0501,
	// RESET: 0x0506,
	// MCU: 0x180d,
}

interface TransactionHandler {
	resolve: (buffer: Uint8Array) => void
	reject: (error: Error) => void
}

export interface ModelSpec {
	controls: LoupedeckControlDefinition[]
	displayMain: Readonly<LoupedeckDisplayDefinition>
	displayLeftStrip: Readonly<LoupedeckDisplayDefinition> | undefined
	displayRightStrip: Readonly<LoupedeckDisplayDefinition> | undefined
	displayWheel?: Readonly<LoupedeckDisplayDefinition> | undefined
	splitTopDisplays?: boolean

	modelId: LoupedeckModelId
	modelName: string

	lcdKeySize: number

	framebufferFlush?: boolean
}

export interface LoupedeckDeviceOptions {
	/**
	 * Legacy option to disable waiting for acks before sending the next message
	 */
	skipWaitForAcks?: boolean
}
export abstract class LoupedeckDeviceBase extends EventEmitter<LoupedeckDeviceEvents> implements LoupedeckDevice {
	readonly #touches: Record<number, LoupedeckTouchObject> = {}
	readonly #connection: LoupedeckSerialConnection

	protected readonly options: LoupedeckDeviceOptions
	protected readonly modelSpec: ModelSpec
	// protected readonly displays: LoupedeckDisplayDefinition[]

	public get controls(): ReadonlyArray<Readonly<LoupedeckControlDefinition>> {
		return this.modelSpec.controls
	}

	public get displayMain(): Readonly<LoupedeckDisplayDefinition> {
		return this.modelSpec.displayMain
	}
	public get displayLeftStrip(): Readonly<LoupedeckDisplayDefinition> | undefined {
		return this.modelSpec.displayLeftStrip
	}
	public get displayRightStrip(): Readonly<LoupedeckDisplayDefinition> | undefined {
		return this.modelSpec.displayRightStrip
	}
	public get displayWheel(): Readonly<LoupedeckDisplayDefinition> | undefined {
		return this.modelSpec.displayWheel
	}

	readonly #pendingTransactions: Record<number, TransactionHandler> = {}
	#nextTransactionId = 0

	readonly #sendQueue: PQueue | undefined

	constructor(connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions, modelSpec: ModelSpec) {
		super()

		this.#connection = connection
		this.options = { ...options }
		this.modelSpec = modelSpec

		if (!this.options.skipWaitForAcks) {
			this.#sendQueue = new PQueue({
				concurrency: 1,
			})
		}

		this.#connection.on('error', (err) => {
			this.#cleanupPendingPromises()
			this.emit('error', err)
		})
		this.#connection.on('disconnect', () => {
			// TODO - not if closed?
			this.#cleanupPendingPromises()
			this.emit('error', new Error('Connection lost'))
		})
		this.#connection.on('message', this.#onMessage.bind(this))
	}

	public get modelId(): LoupedeckModelId {
		return this.modelSpec.modelId
	}
	public get modelName(): string {
		return this.modelSpec.modelName
	}

	public get lcdKeySize(): number {
		return this.modelSpec.lcdKeySize
	}

	#getDisplay(displayId: LoupedeckDisplayId): LoupedeckDisplayDefinition | undefined {
		switch (displayId) {
			case LoupedeckDisplayId.Center:
				return this.displayMain
			case LoupedeckDisplayId.Left:
				return this.displayLeftStrip
			case LoupedeckDisplayId.Right:
				return this.displayRightStrip
			case LoupedeckDisplayId.Wheel:
				return this.displayWheel
			default:
				// TODO Unreachable
				return undefined
		}
	}

	public async blankDevice(doDisplays = true, doButtons = true): Promise<void> {
		// These steps are done manually, so that it is one operation in the queue, otherwise behaviour is a little non-deterministic
		await this.#runInQueueIfEnabled(async () => {
			if (doDisplays) {
				for (const displayId of Object.values<LoupedeckDisplayId>(LoupedeckDisplayId)) {
					const display = this.#getDisplay(displayId)
					if (display) {
						const { encoded, encodedDisplay } = this.createBufferWithHeader(
							displayId,
							display.width + display.xPadding * 2,
							display.height + display.yPadding * 2,
							0,
							0
						)

						await this.#sendAndWaitIfRequired(CommandIds.DrawFramebuffer, encoded, true)

						// This may flush a display multiple times, but avoiding collisions is hard
						if (this.modelSpec.framebufferFlush) {
							await this.#sendAndWaitIfRequired(CommandIds.RefreshDisplay, encodedDisplay, true)
						}
					}
				}
			}

			if (doButtons) {
				const buttons = this.controls.filter(
					(c): c is LoupedeckButtonControlDefinition => c.type === 'button' && c.feedbackType === 'rgb'
				)
				const payload = new Uint8Array(4 * buttons.length)
				const payloadView = uint8ArrayToDataView(payload)
				for (let i = 0; i < buttons.length; i++) {
					payloadView.setUint8(i * 4, buttons[i].encodedIndex)
				}
				await this.#sendAndWaitIfRequired(CommandIds.SetColour, payload, true)
			}
		}, false)
	}

	#cleanupPendingPromises(): void {
		setTimeout(() => {
			for (const promise of Object.values<TransactionHandler>(this.#pendingTransactions)) {
				promise.reject(new Error('Connection closed'))
			}
		}, 0)
	}

	public async close(): Promise<void> {
		this.#cleanupPendingPromises()
		await this.#connection.close()
	}

	/**
	 * Create a buffer with the header predefined.
	 * @returns The buffer and the data offset
	 */
	protected createBufferWithHeader(
		displayId: LoupedeckDisplayId,
		width: number,
		height: number,
		x: number,
		y: number
	): { encoded: Uint8Array; padding: number; encodedDisplay: Uint8Array } {
		if (!this.modelSpec.splitTopDisplays) {
			if (displayId === LoupedeckDisplayId.Left || displayId === LoupedeckDisplayId.Wheel) {
				// Nothing to do
			} else if (displayId === LoupedeckDisplayId.Center) {
				x += this.displayLeftStrip?.width ?? 0
			} else if (displayId === LoupedeckDisplayId.Right) {
				x += (this.displayLeftStrip?.width ?? 0) + (this.displayMain.width + this.displayMain.xPadding * 2)
			} else {
				throw new Error('Unknown DisplayId')
			}
		}

		const padding = 10 // header + id

		const pixelCount = width * height
		const encoded = new Uint8Array(pixelCount * 2 + padding)
		const encodedView = uint8ArrayToDataView(encoded)

		let encodedDisplay = DisplayMainEncodedId
		if (displayId === LoupedeckDisplayId.Wheel) {
			encodedDisplay = DisplayWheelEncodedId
		} else if (this.modelSpec.splitTopDisplays) {
			switch (displayId) {
				case LoupedeckDisplayId.Center:
					encodedDisplay = DisplayCenterEncodedId
					break
				case LoupedeckDisplayId.Left:
					encodedDisplay = DisplayLeftEncodedId
					break
				case LoupedeckDisplayId.Right:
					encodedDisplay = DisplayRightEncodedId
					break
				default:
					throw new Error('Unknown DisplayId')
			}
		}

		encoded.set(encodedDisplay, 0)
		encodedView.setUint16(2, x, false)
		encodedView.setUint16(4, y, false)
		encodedView.setUint16(6, width, false)
		encodedView.setUint16(8, height, false)

		return { encoded, padding, encodedDisplay }
	}

	public async drawBuffer(
		displayId: LoupedeckDisplayId,
		buffer: Uint8Array | Uint8ClampedArray,
		format: LoupedeckBufferFormat,
		width: number,
		height: number,
		x: number,
		y: number
	): Promise<void> {
		const display = this.#getDisplay(displayId)
		if (!display) throw new Error('Invalid DisplayId')

		if (width < 0 || width > display.width) throw new Error('Image width is not valid')
		if (height < 0 || height > display.height) throw new Error('Image width is not valid')
		if (x < 0 || x + width > display.width) throw new Error('x is not valid')
		if (y < 0 || y + height > display.height) throw new Error('x is not valid')

		const { encoded, padding, encodedDisplay } = this.createBufferWithHeader(
			displayId,
			width,
			height,
			x + display.xPadding,
			y + display.yPadding
		)
		const [canDrawPixel, canDrawRow] = createCanDrawPixel(x, y, this.lcdKeySize, display)
		encodeBuffer(buffer, encoded, format, padding, width, height, canDrawPixel, canDrawRow, display.endianness)

		await this.#runInQueueIfEnabled(async () => {
			// Run in the queue as a single operation
			await this.#sendAndWaitIfRequired(CommandIds.DrawFramebuffer, encoded, true)

			if (this.modelSpec.framebufferFlush) {
				await this.#sendAndWaitIfRequired(CommandIds.RefreshDisplay, encodedDisplay, true)
			}
		}, false)
	}

	public async drawKeyBuffer(
		id: string,
		buffer: Uint8Array | Uint8ClampedArray,
		format: LoupedeckBufferFormat
	): Promise<void> {
		const control = this.controls.find(
			(c): c is LoupedeckButtonControlDefinition => c.type === 'button' && c.id === id
		)
		if (!control) throw new Error('Invalid button id')
		if (control.feedbackType !== 'lcd' || !control.lcdPosition) throw new Error('Control is not an LCD button')

		return this.drawBuffer(
			control.lcdPosition.display,
			buffer,
			format,
			control.lcdPosition.size,
			control.lcdPosition.size,
			control.lcdPosition.x,
			control.lcdPosition.y
		)
	}

	public async drawSolidColour(
		displayId: LoupedeckDisplayId,
		color: RGBColor,
		width: number,
		height: number,
		x: number,
		y: number
	): Promise<void> {
		const display = this.#getDisplay(displayId)
		if (!display) throw new Error('Invalid DisplayId')

		if (width < 0 || width > display.width) throw new Error('Image width is not valid')
		if (height < 0 || height > display.height) throw new Error('Image height is not valid')
		if (x < 0 || x + width > display.width) throw new Error('x is not valid')
		if (y < 0 || y + height > display.height) throw new Error('y is not valid')

		checkRGBColor(color)

		const encodedValue =
			(((Math.round(color.red) >> 3) & 0b11111) << 11) +
			(((Math.round(color.green) >> 2) & 0b111111) << 5) +
			((Math.round(color.blue) >> 3) & 0b11111)

		const [canDrawPixel, canDrawRow] = createCanDrawPixel(x, y, this.lcdKeySize, display)

		const { encoded, padding, encodedDisplay } = this.createBufferWithHeader(
			displayId,
			width,
			height,
			x + display.xPadding,
			y
		)
		const encodedView = uint8ArrayToDataView(encoded)

		for (let y = 0; y < height; y++) {
			if (!canDrawRow(y)) continue

			for (let x = 0; x < width; x++) {
				if (canDrawPixel(x, y)) {
					const i = y * width + x
					encodedView.setUint16(i * 2 + padding, encodedValue, display.endianness !== 'BE')
				}
			}
		}

		await this.#runInQueueIfEnabled(async () => {
			// Run in the queue as a single operation
			await this.#sendAndWaitIfRequired(CommandIds.DrawFramebuffer, encoded, true)

			if (this.modelSpec.framebufferFlush) {
				await this.#sendAndWaitIfRequired(CommandIds.RefreshDisplay, encodedDisplay, true)
			}
		}, false)
	}

	public async getFirmwareVersion(): Promise<string> {
		const buffer = await this.#sendAndWaitForResult(CommandIds.GetVersion, undefined)

		const bufferView = uint8ArrayToDataView(buffer)

		return `${bufferView.getUint8(0)}.${bufferView.getUint8(1)}.${bufferView.getUint8(2)}`
	}

	public async getSerialNumber(): Promise<string> {
		const buffer = await this.#sendAndWaitForResult(CommandIds.GetSerialNumber, undefined)

		return new TextDecoder().decode(buffer).trim()
	}

	#onMessage(buff: Uint8Array): void {
		try {
			const bufferView = uint8ArrayToDataView(buff)

			const length = bufferView.getUint8(2)
			if (length + 2 !== buff.length) return
			const header = bufferView.getUint8(3)

			const transactionID = bufferView.getUint8(4)

			if (transactionID === 0) {
				switch (header) {
					case 0x00: // Press
						this.#onPress(buff.subarray(5))
						break
					case 0x01: // Rotate
						this.#onRotate(buff.subarray(5))
						break
					case 0x4d: // touchmove
						this.onTouch('touchmove', buff.subarray(5))
						break
					case 0x6d: // touchend
						this.onTouch('touchend', buff.subarray(5))
						break
					case 0x52: // wheel touchmove
						this.onWheelTouch('touchmove', buff.subarray(5))
						break
					case 0x72: // wheel touchend
						this.onWheelTouch('touchend', buff.subarray(5))
						break
					default:
						console.warn('unhandled incoming message', buff)
						break
				}
			} else {
				const resolver = this.#pendingTransactions[transactionID]
				if (resolver) {
					resolver.resolve(buff.subarray(5))
					delete this.#pendingTransactions[transactionID]
				}
			}
		} catch (e) {
			console.error('Unhandled error in serial message handler:', e)
		}
	}
	#onPress(buff: Uint8Array): void {
		const buffView = uint8ArrayToDataView(buff)
		const controlEncoded = buffView.getUint8(0)
		const control = this.controls.find(
			(b) => (b.type === 'button' || b.type === 'encoder') && b.encodedIndex === controlEncoded
		)
		if (control) {
			const event = buffView.getUint8(1) === 0x00 ? 'down' : 'up'
			this.emit(event, control)
		}
	}
	#onRotate(buff: Uint8Array): void {
		const buffView = uint8ArrayToDataView(buff)
		const controlEncoded = buffView.getUint8(0)
		const control =
			controlEncoded === 0
				? this.controls.find((c) => c.type === 'wheel')
				: this.controls.find((b) => b.type === 'encoder' && b.encodedIndex === controlEncoded)
		if (control) {
			const delta = buffView.getInt8(1)
			this.emit('rotate', control, delta)
		}
	}

	#createTouch(
		event: 'touchmove' | 'touchend' | 'touchstart',
		x: number,
		y: number,
		id: number,
		screen: LoupedeckDisplayId,
		control: LoupedeckControlDefinition | undefined
	): void {
		// Create touch
		const touch: LoupedeckTouchObject = { x, y, id, target: { screen, control: control } }

		// End touch, remove from local cache
		if (event === 'touchend') {
			delete this.#touches[touch.id]
		} else {
			// First time seeing this touch, emit touchstart instead of touchmove
			if (!this.#touches[touch.id]) event = 'touchstart'
			this.#touches[touch.id] = touch
		}

		this.emit(event, { touches: Object.values<LoupedeckTouchObject>(this.#touches), changedTouches: [touch] })
	}

	protected onTouch(event: 'touchmove' | 'touchend' | 'touchstart', buff: Uint8Array): void {
		// Parse buffer
		const buffView = uint8ArrayToDataView(buff)
		let x = buffView.getUint16(1, false)
		let y = buffView.getUint16(3, false)
		const id = buffView.getUint8(5)

		const mainFullWidth = this.displayMain.width + this.displayMain.xPadding * 2
		const leftWidth = this.displayLeftStrip?.width ?? 0

		// Figure out which subscreen was touched
		let screen: LoupedeckDisplayId = LoupedeckDisplayId.Center
		const rightX = (this.displayLeftStrip?.width ?? 0) + mainFullWidth
		if (this.displayLeftStrip && x < leftWidth) {
			screen = LoupedeckDisplayId.Left
		} else if (this.displayRightStrip && x >= rightX) {
			screen = LoupedeckDisplayId.Right
			x -= rightX
		} else {
			// else center
			x -= leftWidth + this.displayMain.xPadding
			y -= this.displayMain.yPadding
		}

		const control = this.modelSpec.controls.find((c) => {
			if (c.type !== 'button' || c.feedbackType !== 'lcd' || !c.lcdPosition) return false

			// Bounds check
			if (x < c.lcdPosition.x || x >= c.lcdPosition.x + c.lcdPosition.size) return false
			if (y < c.lcdPosition.y || y >= c.lcdPosition.y + c.lcdPosition.size) return false

			return true
		})

		this.#createTouch(event, x, y, id, screen, control)
	}

	protected onWheelTouch(event: 'touchmove' | 'touchend' | 'touchstart', buff: Uint8Array): void {
		// Parse buffer
		const buffView = uint8ArrayToDataView(buff)
		const x = buffView.getUint16(1, false)
		const y = buffView.getUint16(3, false)
		const id = buffView.getUint8(5)

		const screen: LoupedeckDisplayId = LoupedeckDisplayId.Wheel
		const key = undefined

		this.#createTouch(event, x, y, id, screen, key)
	}

	public async setBrightness(value: number): Promise<void> {
		const MAX_BRIGHTNESS = 10
		const byte = Math.max(0, Math.min(MAX_BRIGHTNESS, Math.round(value * MAX_BRIGHTNESS)))
		return this.#sendAndWaitIfRequired(CommandIds.SetBrightness, new Uint8Array([byte]))
	}

	public async setButtonColor(
		...buttons: Array<{ id: string; red: number; green: number; blue: number }>
	): Promise<void> {
		if (buttons.length === 0) return

		// Compile a set of the valid button ids
		const buttonIdLookup: Record<string, number | undefined> = {}
		for (const control of this.controls) {
			if (control.type === 'button' && control.feedbackType === 'rgb') {
				buttonIdLookup[control.id] = control.encodedIndex
			}
		}

		// TODO - do we need to check for duplicates?

		const payload = new Uint8Array(4 * buttons.length)
		const payloadView = uint8ArrayToDataView(payload)

		for (let i = 0; i < buttons.length; i++) {
			const button = buttons[i]
			const offset = i * 4

			const encodedId = buttonIdLookup[button.id]
			if (encodedId === undefined) throw new TypeError('Expected a valid button id')

			checkRGBValue(button.red)
			checkRGBValue(button.green)
			checkRGBValue(button.blue)

			payloadView.setUint8(0 + offset, encodedId)
			payloadView.setUint8(1 + offset, button.red)
			payloadView.setUint8(2 + offset, button.green)
			payloadView.setUint8(3 + offset, button.blue)
		}

		return this.#sendAndWaitIfRequired(CommandIds.SetColour, payload)
	}

	public async vibrate(pattern: LoupedeckVibratePattern): Promise<void> {
		if (!pattern) throw new Error('Invalid vibrate pattern')
		// TODO - validate pattern better?

		return this.#sendAndWaitIfRequired(CommandIds.SetVibration, new Uint8Array([pattern]))
	}

	async #runInQueueIfEnabled<T>(fn: () => Promise<T>, forceSkipQueue: boolean) {
		if (this.#sendQueue && !forceSkipQueue) {
			return this.#sendQueue.add(fn, {
				throwOnTimeout: true,
			})
		} else {
			return fn()
		}
	}

	async #sendAndWaitIfRequired(
		commandId: number,
		payload: Uint8Array | Uint8ClampedArray | undefined,
		skipQueue = false
	): Promise<void> {
		return this.#runInQueueIfEnabled(async () => {
			const transactionId = await this.#sendCommand(commandId, payload)

			if (!this.options.skipWaitForAcks) await this.#waitForTransaction(transactionId)
		}, skipQueue)
	}
	async #sendAndWaitForResult(
		commandId: number,
		payload: Uint8Array | Uint8ClampedArray | undefined,
		skipQueue = false
	): Promise<Uint8Array> {
		return this.#runInQueueIfEnabled(async () => {
			const transactionId = await this.#sendCommand(commandId, payload)

			return this.#waitForTransaction(transactionId)
		}, skipQueue)
	}

	async #sendCommand(commandId: number, payload: Uint8Array | Uint8ClampedArray | undefined): Promise<number> {
		if (!this.#connection.isReady()) throw new Error('Not connected!')

		this.#nextTransactionId = (this.#nextTransactionId + 1) % 256
		// Skip transaction ID's of zero since the device seems to ignore them
		if (this.#nextTransactionId === 0) this.#nextTransactionId++

		const packet = new Uint8Array(3 + (payload?.length ?? 0))
		const packetView = uint8ArrayToDataView(packet)

		packetView.setUint8(0, packet.length >= 0xff ? 0xff : packet.length) // TODO - what if it is longer?
		packetView.setUint8(1, commandId)
		packetView.setUint8(2, this.#nextTransactionId)
		if (payload && payload.length) {
			packet.set(payload, 3)
		}

		await this.#connection.send(packet)

		return this.#nextTransactionId
	}
	async #waitForTransaction(transactionID: number): Promise<Uint8Array> {
		if (this.#pendingTransactions[transactionID]) throw new Error('Transaction handler already defined')
		if (!this.#connection.isReady()) throw new Error('Connection is not open')

		const handler: TransactionHandler = {
			resolve: () => null,
			reject: () => null,
		}

		const promise = new Promise<Uint8Array>((resolve, reject) => {
			handler.resolve = resolve
			handler.reject = reject
		})

		this.#pendingTransactions[transactionID] = handler

		return promise
	}
}
