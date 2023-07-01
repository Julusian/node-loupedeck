import { EventEmitter } from 'eventemitter3'
import { LoupedeckDeviceEvents, LoupedeckTouchObject } from '../events'
import {
	DisplayCenterEncodedId,
	DisplayWheelEncodedId,
	LoupedeckBufferFormat,
	LoupedeckControlType,
	LoupedeckDisplayId,
	LoupedeckVibratePattern,
	RGBColor,
} from '../constants'
import { LoupedeckSerialConnection } from '../serial'
import { checkRGBColor, checkRGBValue, createCanDrawPixel, encodeBuffer } from '../util'
import { LoupedeckControlDefinition, LoupedeckDevice, LoupedeckDisplayDefinition } from './interface'
import { LoupedeckModelId } from '../info'
import PQueue from 'p-queue'

enum CommandIds {
	SetColour = 0x02,
	GetSerialNumber = 0x03,
	GetVersion = 0x07,
	SetBrightness = 0x09,
	// RefreshDisplay = 0x0f,
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
	resolve: (buffer: Buffer) => void
	reject: (error: Error) => void
}

export interface ModelSpec {
	controls: LoupedeckControlDefinition[]
	displayMain: Readonly<LoupedeckDisplayDefinition>
	displayLeftStrip: Readonly<LoupedeckDisplayDefinition> | undefined
	displayRightStrip: Readonly<LoupedeckDisplayDefinition> | undefined
	displayWheel?: Readonly<LoupedeckDisplayDefinition> | undefined

	modelId: LoupedeckModelId
	modelName: string

	lcdKeyColumns: number
	lcdKeyRows: number
	lcdKeySize: number
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

	public get lcdKeyColumns(): number {
		return this.modelSpec.lcdKeyColumns
	}
	public get lcdKeyRows(): number {
		return this.modelSpec.lcdKeyRows
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
						const [payload] = this.createBufferWithHeader(
							displayId,
							display.width + display.xPadding * 2,
							display.height + display.yPadding * 2,
							0,
							0
						)

						await this.#sendAndWaitIfRequired(CommandIds.DrawFramebuffer, payload, true)
					}
				}
			}

			if (doButtons) {
				const buttons = this.controls.filter((c) => c.type === LoupedeckControlType.Button)
				const payload = Buffer.alloc(4 * buttons.length)
				for (let i = 0; i < buttons.length; i++) {
					payload.writeUInt8(buttons[i].encoded, i * 4)
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

	private convertKeyIndexToCoordinates(index: number, display: LoupedeckDisplayDefinition): [x: number, y: number] {
		const cols = this.lcdKeyColumns

		const width = this.lcdKeySize + (display.columnGap ?? 0)
		const height = this.lcdKeySize + (display.rowGap ?? 0)

		const x = (index % cols) * width
		const y = Math.floor(index / cols) * height

		return [x, y]
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
	): [buffer: Buffer, offset: number] {
		if (displayId === LoupedeckDisplayId.Left || displayId === LoupedeckDisplayId.Wheel) {
			// Nothing to do
		} else if (displayId === LoupedeckDisplayId.Center) {
			x += this.displayLeftStrip?.width ?? 0
		} else if (displayId === LoupedeckDisplayId.Right) {
			x += (this.displayLeftStrip?.width ?? 0) + (this.displayMain.width + this.displayMain.xPadding * 2)
		} else {
			throw new Error('Unknown DisplayId')
		}

		const padding = 10 // header + id

		const pixelCount = width * height
		const encoded = Buffer.alloc(pixelCount * 2 + padding)

		if (displayId === LoupedeckDisplayId.Wheel) {
			DisplayWheelEncodedId.copy(encoded, 0)
		} else {
			DisplayCenterEncodedId.copy(encoded, 0)
		}
		encoded.writeUInt16BE(x, 2)
		encoded.writeUInt16BE(y, 4)
		encoded.writeUInt16BE(width, 6)
		encoded.writeUInt16BE(height, 8)

		return [encoded, padding]
	}

	public async drawBuffer(
		displayId: LoupedeckDisplayId,
		buffer: Buffer,
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

		const [encoded, padding] = this.createBufferWithHeader(
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
		}, false)
	}

	public async drawKeyBuffer(index: number, buffer: Buffer, format: LoupedeckBufferFormat): Promise<void> {
		const [x, y] = this.convertKeyIndexToCoordinates(index, this.displayMain)

		const size = this.lcdKeySize
		return this.drawBuffer(LoupedeckDisplayId.Center, buffer, format, size, size, x, y)
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

		const [encoded, padding] = this.createBufferWithHeader(displayId, width, height, x + display.xPadding, y)
		for (let y = 0; y < height; y++) {
			if (!canDrawRow(y)) continue

			for (let x = 0; x < width; x++) {
				if (canDrawPixel(x, y)) {
					const i = y * width + x
					if (display.endianness === 'BE') {
						encoded.writeUint16BE(encodedValue, i * 2 + padding)
					} else {
						encoded.writeUint16LE(encodedValue, i * 2 + padding)
					}
				}
			}
		}

		await this.#runInQueueIfEnabled(async () => {
			// Run in the queue as a single operation
			await this.#sendAndWaitIfRequired(CommandIds.DrawFramebuffer, encoded, true)
		}, false)
	}

	public async getFirmwareVersion(): Promise<string> {
		const buffer = await this.#sendAndWaitForResult(CommandIds.GetVersion, undefined)

		return `${buffer.readUInt8(0)}.${buffer.readUInt8(1)}.${buffer.readUInt8(2)}`
	}

	public async getSerialNumber(): Promise<string> {
		const buffer = await this.#sendAndWaitForResult(CommandIds.GetSerialNumber, undefined)

		return buffer.toString().trim()
	}

	#onMessage(buff: Buffer): void {
		try {
			const length = buff.readUint8(2)
			if (length + 2 !== buff.length) return
			const header = buff.readUInt8(3)

			const transactionID = buff.readUInt8(4)

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
	#onPress(buff: Buffer): void {
		const controlEncoded = buff.readUint8(0)
		const control = this.controls.find((b) => b.encoded === controlEncoded)
		if (control) {
			const event = buff.readUint8(1) === 0x00 ? 'down' : 'up'
			this.emit(event, { type: control.type, index: control.index })
		}
	}
	#onRotate(buff: Buffer): void {
		const controlEncoded = buff.readUInt8(0)
		const control = this.controls.find((b) => b.encoded === controlEncoded)
		if (control && control.type === LoupedeckControlType.Rotary) {
			const delta = buff.readInt8(1)
			this.emit('rotate', { type: control.type, index: control.index }, delta)
		}
	}

	#createTouch(
		event: 'touchmove' | 'touchend' | 'touchstart',
		x: number,
		y: number,
		id: number,
		screen: LoupedeckDisplayId,
		key: number | undefined
	): void {
		// Create touch
		const touch: LoupedeckTouchObject = { x, y, id, target: { screen, key } }

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

	protected onTouch(event: 'touchmove' | 'touchend' | 'touchstart', buff: Buffer): void {
		// Parse buffer
		let x = buff.readUInt16BE(1)
		let y = buff.readUInt16BE(3)
		const id = buff.readUInt8(5)

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

		let key: number | undefined
		if (screen === LoupedeckDisplayId.Center) {
			// Pad by half the gap, to make the maths simpler
			const xPadded = x + this.displayMain.columnGap / 2
			const yPadded = y + this.displayMain.rowGap / 2

			// Find the column, including the gap as evenly distributed
			const column = Math.floor(xPadded / (this.lcdKeySize + this.displayMain.columnGap))
			const row = Math.floor(yPadded / (this.lcdKeySize + this.displayMain.rowGap))

			key = row * this.lcdKeyColumns + column
		}

		this.#createTouch(event, x, y, id, screen, key)
	}

	protected onWheelTouch(event: 'touchmove' | 'touchend' | 'touchstart', buff: Buffer): void {
		// Parse buffer
		const x = buff.readUInt16BE(1)
		const y = buff.readUInt16BE(3)
		const id = buff.readUInt8(5)

		const screen: LoupedeckDisplayId = LoupedeckDisplayId.Wheel
		const key = undefined

		this.#createTouch(event, x, y, id, screen, key)
	}

	public async setBrightness(value: number): Promise<void> {
		const MAX_BRIGHTNESS = 10
		const byte = Math.max(0, Math.min(MAX_BRIGHTNESS, Math.round(value * MAX_BRIGHTNESS)))
		return this.#sendAndWaitIfRequired(CommandIds.SetBrightness, Buffer.from([byte]))
	}

	public async setButtonColor(
		...buttons: Array<{ id: number; red: number; green: number; blue: number }>
	): Promise<void> {
		if (buttons.length === 0) return

		// Compile a set of the valid button ids
		const buttonIdLookup: Record<number, number | undefined> = {}
		for (const control of this.controls) {
			if (control.type === LoupedeckControlType.Button) {
				buttonIdLookup[control.index] = control.encoded
			}
		}

		// TODO - do we need to check for duplicates?

		const payload = Buffer.alloc(4 * buttons.length)
		for (let i = 0; i < buttons.length; i++) {
			const button = buttons[i]
			const offset = i * 4

			const encodedId = buttonIdLookup[button.id]
			if (encodedId === undefined) throw new TypeError('Expected a valid button id')

			checkRGBValue(button.red)
			checkRGBValue(button.green)
			checkRGBValue(button.blue)

			payload.writeUInt8(encodedId, offset + 0)
			payload.writeUInt8(button.red, offset + 1)
			payload.writeUInt8(button.green, offset + 2)
			payload.writeUInt8(button.blue, offset + 3)
		}

		return this.#sendAndWaitIfRequired(CommandIds.SetColour, payload)
	}

	public async vibrate(pattern: LoupedeckVibratePattern): Promise<void> {
		if (!pattern) throw new Error('Invalid vibrate pattern')
		// TODO - validate pattern better?

		return this.#sendAndWaitIfRequired(CommandIds.SetVibration, Buffer.from([pattern]))
	}

	async #runInQueueIfEnabled<T>(fn: () => Promise<T>, forceSkipQueue: boolean) {
		if (this.#sendQueue && !forceSkipQueue) {
			return this.#sendQueue.add(fn)
		} else {
			return fn()
		}
	}

	async #sendAndWaitIfRequired(commandId: number, payload: Buffer | undefined, skipQueue = false): Promise<void> {
		return this.#runInQueueIfEnabled(async () => {
			const transactionId = await this.#sendCommand(commandId, payload)

			if (!this.options.skipWaitForAcks) await this.#waitForTransaction(transactionId)
		}, skipQueue)
	}
	async #sendAndWaitForResult(commandId: number, payload: Buffer | undefined, skipQueue = false): Promise<Buffer> {
		return this.#runInQueueIfEnabled(async () => {
			const transactionId = await this.#sendCommand(commandId, payload)

			return this.#waitForTransaction(transactionId)
		}, skipQueue)
	}

	async #sendCommand(commandId: number, payload: Buffer | undefined): Promise<number> {
		if (!this.#connection.isReady()) throw new Error('Not connected!')

		this.#nextTransactionId = (this.#nextTransactionId + 1) % 256
		// Skip transaction ID's of zero since the device seems to ignore them
		if (this.#nextTransactionId === 0) this.#nextTransactionId++

		const packet = Buffer.alloc(3 + (payload?.length ?? 0))
		packet.writeUInt8(packet.length >= 0xff ? 0xff : packet.length, 0) // TODO - what if it is longer?
		packet.writeUInt8(commandId, 1)
		packet.writeUInt8(this.#nextTransactionId, 2)
		if (payload && payload.length) {
			payload.copy(packet, 3)
		}

		await this.#connection.send(packet)

		return this.#nextTransactionId
	}
	async #waitForTransaction(transactionID: number): Promise<Buffer> {
		if (this.#pendingTransactions[transactionID]) throw new Error('Transaction handler already defined')
		if (!this.#connection.isReady()) throw new Error('Connection is not open')

		const handler: TransactionHandler = {
			resolve: () => null,
			reject: () => null,
		}

		const promise = new Promise<Buffer>((resolve, reject) => {
			handler.resolve = resolve
			handler.reject = reject
		})

		this.#pendingTransactions[transactionID] = handler

		return promise
	}
}
