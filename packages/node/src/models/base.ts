import { EventEmitter } from 'eventemitter3'
import { LoupedeckDeviceEvents } from '../events'
import {
	LoupedeckBufferFormat,
	LoupedeckControlType,
	LoupedeckDisplayId,
	LoupedeckVibratePattern,
	RGBColor,
} from '../constants'
import { LoupedeckSerialConnection } from '../serial'
import { checkRGBColor, checkRGBValue, createBufferWithHeader, encodeBuffer } from '../util'
import { LoupedeckDevice } from './interface'
import { LoupedeckModelId } from '..'

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
	resolve: (buffer: Buffer) => void
	reject: (error: Error) => void
}

export interface LoupedeckDisplayDefinition {
	id: LoupedeckDisplayId
	width: number
	height: number
	encoded: Buffer
}
export interface LoupedeckControlDefinition {
	type: LoupedeckControlType
	index: number
	encoded: number
}

export interface LoupedeckDeviceOptions {
	/**
	 * Experimental option to wait for acks before sending the next message
	 */
	waitForAcks?: boolean
}
export abstract class LoupedeckDeviceBase extends EventEmitter<LoupedeckDeviceEvents> implements LoupedeckDevice {
	readonly #connection: LoupedeckSerialConnection

	protected readonly options: LoupedeckDeviceOptions
	protected readonly displays: LoupedeckDisplayDefinition[]
	protected readonly controls: LoupedeckControlDefinition[]

	readonly #pendingTransactions: Record<number, TransactionHandler> = {}
	#nextTransactionId: number = 0

	constructor(
		connection: LoupedeckSerialConnection,
		options: LoupedeckDeviceOptions,
		displays: LoupedeckDisplayDefinition[],
		controls: LoupedeckControlDefinition[]
	) {
		super()

		this.#connection = connection
		this.options = { ...options }
		this.displays = displays
		this.controls = controls

		this.#connection.on('error', (err) => this.emit('error', err))
		this.#connection.on('disconnect', () => this.emit('error', new Error('Connection lost'))) // TODO - not if closed?
		this.#connection.on('message', this.#onMessage.bind(this))
	}

	public abstract get modelName(): string
	public abstract get modelId(): LoupedeckModelId

	public close(): void {
		this.#connection.close()
	}

	public async drawBuffer(
		displayId: LoupedeckDisplayId,
		buffer: Buffer,
		format: LoupedeckBufferFormat,
		width: number,
		height: number,
		x: number,
		y: number,
		refreshDisplay = true
	) {
		const display = this.displays.find((d) => d.id === displayId)
		if (!display) throw new Error('Invalid DisplayId')

		if (width < 0 || width > display.width) throw new Error('Image width is not valid')
		if (height < 0 || height > display.height) throw new Error('Image width is not valid')
		if (x < 0 || x + width > display.width) throw new Error('x is not valid')
		if (y < 0 || y + height > display.height) throw new Error('x is not valid')

		const [encoded, padding] = createBufferWithHeader(display.encoded, width, height, x, y)
		encodeBuffer(buffer, encoded, format, padding, width * height)

		// Write to frame buffer
		await this.sendAndWaitIfRequired(CommandIds.DrawFramebuffer, encoded)

		if (refreshDisplay) await this.refreshDisplay(displayId)
	}

	public async drawSolidColour(
		displayId: LoupedeckDisplayId,
		color: RGBColor,
		width: number,
		height: number,
		x: number,
		y: number,
		refreshDisplay = true
	): Promise<void> {
		const display = this.displays.find((d) => d.id === displayId)
		if (!display) throw new Error('Invalid DisplayId')

		if (width < 0 || width > display.width) throw new Error('Image width is not valid')
		if (height < 0 || height > display.height) throw new Error('Image width is not valid')
		if (x < 0 || x + width > display.width) throw new Error('x is not valid')
		if (y < 0 || y + height > display.height) throw new Error('x is not valid')

		checkRGBColor(color)

		const encodedValue = (Math.round(color.red) << 11) + (Math.round(color.green) << 5) + Math.round(color.blue)

		const [encoded, padding] = createBufferWithHeader(display.encoded, width, height, x, y)
		for (let i = 0; i < width * height; i++) {
			encoded.writeUint16LE(encodedValue, i * 2 + padding)
		}

		// Write to frame buffer
		await this.sendAndWaitIfRequired(CommandIds.DrawFramebuffer, encoded)

		if (refreshDisplay) await this.refreshDisplay(displayId)
	}

	// public async drawKeyBuffer(index: number, buffer: )

	// // Draw to a specific key index (0-12)
	// drawKeyBuffer(index, buffer) {
	//     // Get offset x/y for key index
	//     const width = 90
	//     const height = 90
	//     const x = index % 4 * width
	//     const y = Math.floor(index / 4) * height
	//     return this.drawBuffer({ id: 'center', x, y, width, height, buffer })
	// }
	// // Draw to a specific screen
	// drawScreenBuffer(id, buffer) {
	//     return this.drawBuffer({ id, buffer })
	// }
	#onMessage(buff: Buffer): void {
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
			}
		} else {
			const resolver = this.#pendingTransactions[transactionID]
			if (resolver) resolver.resolve(buff.subarray(5))
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
	protected abstract onTouch(event: 'touchmove' | 'touchend' | 'touchstart', buff: Buffer): void

	public async refreshDisplay(id: LoupedeckDisplayId): Promise<void> {
		const display = this.displays.find((d) => d.id === id)
		if (!display) throw new Error('Invalid DisplayId')

		return this.sendAndWaitIfRequired(CommandIds.RefreshDisplay, display.encoded)
	}

	public async getSerialNumber(): Promise<string> {
		const transactionId = this.send(CommandIds.GetVersion, undefined)

		const buffer = await this.waitForTransaction(transactionId)

		return buffer.toString().trim()
	}
	public async getFirmwareVersion(): Promise<string> {
		const transactionId = this.send(CommandIds.GetVersion, undefined)

		const buffer = await this.waitForTransaction(transactionId)

		return `${buffer.readUInt8(0)}.${buffer.readUInt8(1)}.${buffer.readUInt8(2)}`
	}

	public async setBrightness(value: number): Promise<void> {
		const MAX_BRIGHTNESS = 10
		const byte = Math.max(0, Math.min(MAX_BRIGHTNESS, Math.round(value * MAX_BRIGHTNESS)))
		return this.sendAndWaitIfRequired(CommandIds.SetBrightness, Buffer.from([byte]))
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

		return this.sendAndWaitIfRequired(CommandIds.SetColour, payload)
	}
	public async vibrate(pattern: LoupedeckVibratePattern): Promise<void> {
		if (!pattern) throw new Error('Invalid vibrate pattern')
		// TODO - validate pattern better?

		return this.sendAndWaitIfRequired(CommandIds.SetVibration, Buffer.from([pattern]))
	}

	public async blankDevice(doDisplays = true, doButtons = true): Promise<void> {
		if (doDisplays) {
			const black: RGBColor = { red: 0, green: 0, blue: 0 }
			for (const display of this.displays) {
				await this.drawSolidColour(display.id, black, display.width, display.height, 0, 0, true)
			}
		}

		if (doButtons) {
			const buttonColors: Array<{ id: number; red: number; green: number; blue: number }> = []
			for (const control of this.controls) {
				if (control.type === LoupedeckControlType.Button) {
					buttonColors.push({ id: control.index, red: 0, green: 0, blue: 0 })
				}
			}
			await this.setButtonColor(...buttonColors)
		}
	}

	private async sendAndWaitIfRequired(commandId: number, payload: Buffer | undefined): Promise<void> {
		const transactionId = this.send(commandId, payload)

		if (this.options.waitForAcks) await this.waitForTransaction(transactionId)
	}

	private send(commandId: number, payload: Buffer | undefined): number {
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

		this.#connection.send(packet)

		return this.#nextTransactionId
	}
	private waitForTransaction(transactionID: number): Promise<Buffer> {
		if (this.#pendingTransactions[transactionID]) throw new Error('Transaction handler already defined')

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
