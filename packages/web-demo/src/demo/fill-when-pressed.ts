import type { LoupedeckControlDefinition, LoupedeckDevice, LoupedeckTouchEventData, RGBColor } from '@loupedeck/web'
import { LoupedeckBufferFormat, LoupedeckDisplayId, LoupedeckModelId } from '@loupedeck/web'
import type { Demo } from './demo.js'

const colorRed: RGBColor = { red: 255, green: 0, blue: 0 }
const colorBlack: RGBColor = { red: 0, green: 0, blue: 0 }

const bufferBlack = new Uint8Array(80 * 80 * 3)
const bufferRed = new Uint8Array(80 * 80 * 3)
for (let i = 0; i < 80 * 80; i++) {
	bufferRed.set([255, 0, 0], i * 3)
}

export class FillWhenPressedDemo implements Demo {
	private pressed: string[] = []
	private touchBoxes = new Set<string>()
	private touchingLeft = false
	private touchingRight = false

	public async start(device: LoupedeckDevice): Promise<void> {
		await device.blankDevice(true, false)
	}
	public async stop(device: LoupedeckDevice): Promise<void> {
		await device.blankDevice(true, false)
	}
	public async controlDown(device: LoupedeckDevice, info: LoupedeckControlDefinition): Promise<void> {
		if (this.pressed.indexOf(info.id) === -1) {
			this.pressed.push(info.id)

			if (device.modelId === LoupedeckModelId.RazerStreamControllerX) {
				await device.drawKeyBuffer(info.id, bufferRed, LoupedeckBufferFormat.RGB)
			} else {
				await device.setButtonColor({ id: info.id, ...colorRed })
			}
		}
	}
	public async controlUp(device: LoupedeckDevice, info: LoupedeckControlDefinition): Promise<void> {
		const index = this.pressed.indexOf(info.id)
		if (index !== -1) {
			this.pressed.splice(index, 1)

			if (device.modelId === LoupedeckModelId.RazerStreamControllerX) {
				await device.drawKeyBuffer(info.id, bufferBlack, LoupedeckBufferFormat.RGB)
			} else {
				await device.setButtonColor({ id: info.id, ...colorBlack })
			}
		}
	}

	public async controlRotate(
		_device: LoupedeckDevice,
		_info: LoupedeckControlDefinition,
		_delta: number
	): Promise<void> {
		// Ignored
	}

	public async touchStart(device: LoupedeckDevice, event: LoupedeckTouchEventData): Promise<void> {
		return this.touchMove(device, event)
	}
	public async touchMove(device: LoupedeckDevice, event: LoupedeckTouchEventData): Promise<void> {
		const ps: Array<Promise<void>> = []

		const newIds = new Set<string>()
		let leftPercent = 0
		let rightPercent = 0

		for (const touch of event.touches) {
			if (touch.target.screen === LoupedeckDisplayId.Center && touch.target.control !== undefined) {
				newIds.add(touch.target.control.id)

				if (!this.touchBoxes.has(touch.target.control.id)) {
					this.touchBoxes.add(touch.target.control.id)

					ps.push(device.drawKeyBuffer(touch.target.control.id, bufferRed, LoupedeckBufferFormat.RGB))
				}
			} else if (touch.target.screen === LoupedeckDisplayId.Left && device.displayLeftStrip) {
				const percent = touch.y / device.displayLeftStrip.height
				leftPercent = Math.max(leftPercent, percent)
			} else if (touch.target.screen === LoupedeckDisplayId.Right && device.displayRightStrip) {
				const percent = touch.y / device.displayRightStrip.height
				rightPercent = Math.max(rightPercent, percent)
			}
		}

		for (const key of this.touchBoxes) {
			if (!newIds.has(key)) {
				this.touchBoxes.delete(key)

				ps.push(device.drawKeyBuffer(key, bufferBlack, LoupedeckBufferFormat.RGB))
			}
		}

		if (device.displayLeftStrip && (leftPercent > 0 || this.touchingLeft)) {
			this.touchingLeft = leftPercent > 0

			ps.push(
				device.drawSolidColour(
					LoupedeckDisplayId.Left,
					{ red: Math.round(255 * leftPercent), green: 0, blue: 0 },
					device.displayLeftStrip.width,
					device.displayLeftStrip.height,
					0,
					0
				)
			)
		}

		if (device.displayRightStrip && (rightPercent > 0 || this.touchingRight)) {
			this.touchingRight = rightPercent > 0

			ps.push(
				device.drawSolidColour(
					LoupedeckDisplayId.Right,
					{ red: Math.round(255 * rightPercent), green: 0, blue: 0 },
					device.displayRightStrip.width,
					device.displayRightStrip.height,
					0,
					0
				)
			)
		}

		await Promise.allSettled(ps)
	}
	public async touchEnd(device: LoupedeckDevice, event: LoupedeckTouchEventData): Promise<void> {
		return this.touchMove(device, event)
	}
}
