import EventEmitter = require('eventemitter3')
import { LoupedeckDeviceEvents } from '../events'
import { LoupedeckBufferFormat, LoupedeckDisplayId, LoupedeckVibratePattern, RGBColor } from '../constants'
import { LoupedeckModelId } from '..'

export interface LoupedeckDevice extends EventEmitter<LoupedeckDeviceEvents> {
	/**
	 * A descriptive name for this type of Loupedeck device
	 */
	modelName: string

	/**
	 * Model of this device
	 */
	modelId: LoupedeckModelId

	/**
	 * Close the device
	 */
	close(): void

	/**
	 * Draw a buffer to a display
	 * @param displayId The display to draw to
	 * @param buffer The buffer to draw
	 * @param format The format of the source buffer
	 * @param width The width of the buffer
	 * @param height The height of the buffer
	 * @param x The x offset of the region
	 * @param y The y offset of the region
	 * @param skipRefreshDisplay Skip refreshing the display, to allow for batching draws
	 */
	drawBuffer(
		displayId: LoupedeckDisplayId,
		buffer: Buffer,
		format: LoupedeckBufferFormat,
		width: number,
		height: number,
		x: number,
		y: number,
		skipRefreshDisplay?: boolean
	): Promise<void>

	/**
	 * Draw a solid colour to a display
	 * @param displayId The display to draw to
	 * @param color The color to draw
	 * @param width The width of the region
	 * @param height The height of the region
	 * @param x The x offset of the region
	 * @param y The y offset of the region
	 * @param skipRefreshDisplay Skip refreshing the display, to allow for batching draws
	 */
	drawSolidColour(
		displayId: LoupedeckDisplayId,
		color: RGBColor,
		width: number,
		height: number,
		x: number,
		y: number,
		skipRefreshDisplay?: boolean
	): Promise<void>

	//  async drawKeyBuffer(index: number, buffer: )

	// // Draw to a specific key index (0-12)
	// drawKeyBuffer(index, buffer)
	// // Draw to a specific screen
	// drawScreenBuffer(id, buffer)

	/**
	 * Refresh a display to show pending updates in the framebuffer
	 * @param id Display to refresh
	 */
	refreshDisplay(id: LoupedeckDisplayId): Promise<void>

	/**
	 * Get the serial number of the device
	 */
	getSerialNumber(): Promise<string>

	/**
	 * Get the firmware version string
	 */
	getFirmwareVersion(): Promise<string>

	/**
	 * Set the brightness of the displays
	 * @param value 0-10
	 */
	setBrightness(value: number): Promise<void>

	/**
	 * Set the color of one of more buttons
	 */
	setButtonColor(...buttons: Array<{ id: number; red: number; green: number; blue: number }>): Promise<void>

	/**
	 * Vibrate the device
	 * @param pattern The pattern to activate
	 */
	vibrate(pattern: LoupedeckVibratePattern): Promise<void>

	/**
	 * Reset all the displays and buttons on the device to black
	 */
	blankDevice(doDisplays: boolean, doButtons: boolean): Promise<void>
}
