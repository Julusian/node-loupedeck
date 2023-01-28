import {
	LoupedeckBufferFormat,
	LoupedeckControlInfo,
	LoupedeckDevice,
	LoupedeckDisplayId,
	LoupedeckTouchEventData,
	RGBColor,
} from '@loupedeck/web'
import { Demo } from './demo'

function stringifyInfo(info: LoupedeckControlInfo): string {
	return `${info.type}-${info.index}`
}

const colorRed: RGBColor = { red: 255, green: 0, blue: 0 }
const colorBlack: RGBColor = { red: 0, green: 0, blue: 0 }

const redBuffer = Buffer.alloc(90 * 90 * 3, Buffer.from([255, 0, 0]))
const blackBuffer = Buffer.alloc(90 * 90 * 3)

export class FillWhenPressedDemo implements Demo {
	private pressed: string[] = []
	private touchBoxes = new Set<number>()

	public async start(device: LoupedeckDevice): Promise<void> {
		await device.blankDevice(true, false)
	}
	public async stop(device: LoupedeckDevice): Promise<void> {
		await device.blankDevice(true, false)
	}
	public async controlDown(device: LoupedeckDevice, info: LoupedeckControlInfo): Promise<void> {
		const id = stringifyInfo(info)
		if (this.pressed.indexOf(id) === -1) {
			this.pressed.push(id)

			await device.setButtonColor({ id: info.index, ...colorRed })
		}
	}
	public async controlUp(device: LoupedeckDevice, info: LoupedeckControlInfo): Promise<void> {
		const id = stringifyInfo(info)
		const index = this.pressed.indexOf(id)
		if (index !== -1) {
			this.pressed.splice(index, 1)

			await device.setButtonColor({ id: info.index, ...colorBlack })
		}
	}

	public async controlRotate(_device: LoupedeckDevice, _info: LoupedeckControlInfo, _delta: number): Promise<void> {
		// Ignored
	}

	public async touchStart(device: LoupedeckDevice, event: LoupedeckTouchEventData): Promise<void> {
		return this.touchMove(device, event)
	}
	public async touchMove(device: LoupedeckDevice, event: LoupedeckTouchEventData): Promise<void> {
		const ps: Array<Promise<void>> = []

		const newIds = new Set<number>()

		for (const touch of event.touches) {
			if (touch.target.screen === LoupedeckDisplayId.Center && touch.target.key !== undefined) {
				newIds.add(touch.target.key)

				if (!this.touchBoxes.has(touch.target.key)) {
					this.touchBoxes.add(touch.target.key)

					ps.push(device.drawKeyBuffer(touch.target.key, redBuffer, LoupedeckBufferFormat.RGB))
				}
			}
		}

		for (const key of this.touchBoxes) {
			if (!newIds.has(key)) {
				this.touchBoxes.delete(key)

				ps.push(device.drawKeyBuffer(key, blackBuffer, LoupedeckBufferFormat.RGB))
			}
		}

		await Promise.allSettled(ps)
	}
	public async touchEnd(device: LoupedeckDevice, event: LoupedeckTouchEventData): Promise<void> {
		return this.touchMove(device, event)
	}
}
