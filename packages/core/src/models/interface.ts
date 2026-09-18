import type { EventEmitter } from 'eventemitter3'
import type { LoupedeckDeviceEvents } from '../events.js'
import type { LoupedeckBufferFormat, LoupedeckDisplayId, LoupedeckVibratePattern, RGBColor } from '../constants.js'
import type { LoupedeckModelId } from '../info.js'
import type { LoupedeckControlDefinition } from '../controlDefinition.js'

export interface VibrateOptions {
	/**
	 * Submit after any earlier queued commands finish, then resolve after the
	 * transport write completes without waiting for this vibration's
	 * acknowledgement. Only one best-effort vibration can be outstanding at a time.
	 */
	bestEffort?: boolean
	/**
	 * Shorten the vibration by submitting a second pattern shortly after the first.
	 * A new vibration command replaces the one that is playing, so a pattern that is
	 * too weak to feel cuts the first one short. Both commands are submitted from the
	 * same queue slot, so other queued commands cannot change the spacing; with
	 * `skipWaitForAcks` there is no queue and other writes can land between them.
	 * Requires `bestEffort`; neither acknowledgement is waited for.
	 */
	interrupt?: VibrateInterruptOptions
}

export interface VibrateInterruptOptions {
	/** Delay between the two transport writes, from 1 to 250 milliseconds */
	afterMs: number
	/** The pattern that replaces the first one */
	pattern: LoupedeckVibratePattern
}

export interface LoupedeckDisplayDefinition {
	/** Total usable width of the display */
	width: number
	/** Total usable height of the display */
	height: number
	/** Deadspace to the left and right of the display */
	xPadding: number
	/** Deadspace to the top and bottom of the display */
	yPadding: number
	/** Deadspace between each button column */
	columnGap: number
	/** Deadspace between each button row */
	rowGap: number
	/** The endianness of the pixelbuffer */
	endianness?: 'LE' | 'BE'
}

export interface LoupedeckDevice extends EventEmitter<LoupedeckDeviceEvents> {
	/**
	 * Model of this device
	 */
	modelId: LoupedeckModelId

	/**
	 * A descriptive name for this type of Loupedeck device
	 */
	modelName: string

	/**
	 * Pixel size of key on LCD button grid
	 */
	lcdKeySize: number

	/**
	 * List of controls available
	 */
	controls: ReadonlyArray<Readonly<LoupedeckControlDefinition>>

	displayMain: Readonly<LoupedeckDisplayDefinition>
	displayLeftStrip: Readonly<LoupedeckDisplayDefinition> | undefined
	displayRightStrip: Readonly<LoupedeckDisplayDefinition> | undefined
	displayWheel: Readonly<LoupedeckDisplayDefinition> | undefined

	/**
	 * Reset all the displays and buttons on the device to black
	 */
	blankDevice(doDisplays: boolean, doButtons: boolean): Promise<void>

	/**
	 * Close the device
	 */
	close(): Promise<void>

	/**
	 * Draw a buffer to a display
	 * @param displayId The display to draw to
	 * @param buffer The buffer to draw
	 * @param format The format of the source buffer
	 * @param width The width of the buffer
	 * @param height The height of the buffer
	 * @param x The x offset of the region
	 * @param y The y offset of the region
	 */
	drawBuffer(
		displayId: LoupedeckDisplayId,
		buffer: Uint8Array | Uint8ClampedArray,
		format: LoupedeckBufferFormat,
		width: number,
		height: number,
		x: number,
		y: number
	): Promise<void>

	/**
	 * Draw a buffer to a key on the display
	 * @param index Key id
	 * @param buffer The buffer to draw
	 * @param format The format of the source buffer
	 */
	drawKeyBuffer(id: string, buffer: Uint8Array | Uint8ClampedArray, format: LoupedeckBufferFormat): Promise<void>

	/**
	 * Draw a solid colour to a display
	 * @param displayId The display to draw to
	 * @param color The color to draw
	 * @param width The width of the region
	 * @param height The height of the region
	 * @param x The x offset of the region
	 * @param y The y offset of the region
	 */
	drawSolidColour(
		displayId: LoupedeckDisplayId,
		color: RGBColor,
		width: number,
		height: number,
		x: number,
		y: number
	): Promise<void>

	/**
	 * Get the firmware version string
	 */
	getFirmwareVersion(): Promise<string>

	/**
	 * Get the serial number of the device
	 */
	getSerialNumber(): Promise<string>

	/**
	 * Set the brightness of the displays
	 * @param value 0-1
	 */
	setBrightness(value: number): Promise<void>

	/**
	 * Set the color of one of more buttons
	 */
	setButtonColor(...buttons: Array<{ id: string; red: number; green: number; blue: number }>): Promise<void>

	/**
	 * Vibrate the device
	 * @param pattern The pattern to activate
	 */
	vibrate(pattern: LoupedeckVibratePattern, options?: VibrateOptions): Promise<void>
}
