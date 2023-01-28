import {
	LoupedeckControlInfo,
	LoupedeckDevice,
	LoupedeckDisplayId,
	LoupedeckTouchEventData,
	RGBColor,
} from '@loupedeck/web'
import { Demo } from './demo'

function getRandomIntInclusive(min: number, max: number) {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min + 1)) + min
}

export class RapidFillDemo implements Demo {
	private interval: number | undefined
	private running: Promise<void[]> | undefined

	public async start(device: LoupedeckDevice): Promise<void> {
		if (!this.interval) {
			const doThing = async () => {
				if (!this.running) {
					const color: RGBColor = {
						red: getRandomIntInclusive(0, 255),
						green: getRandomIntInclusive(0, 255),
						blue: getRandomIntInclusive(0, 255),
					}
					console.log('Filling with rgb(%d, %d, %d)', color.red, color.green, color.blue)

					const width = device.lcdKeySize * device.lcdKeyColumns
					const height = device.lcdKeySize * device.lcdKeyRows

					this.running = Promise.all([
						device.drawSolidColour(LoupedeckDisplayId.Center, color, width, height, 0, 0),
						// TODO fix
						// device.setButtonColor(
						// 	...(device.controls
						// 		.map((control) => {
						// 			if (control.type === LoupedeckControlType.Button) {
						// 				return { id: control.index, ...color }
						// 			} else {
						// 				return undefined
						// 			}
						// 		})
						// 		.filter((c) => !!c) as any[])
						// ),
					])

					try {
						await this.running
					} finally {
						this.running = undefined
					}
				}
			}
			this.interval = window.setInterval(() => {
				doThing().catch((e) => console.log(e))
			}, 1000 / 5)
		}
	}
	public async stop(device: LoupedeckDevice): Promise<void> {
		if (this.interval) {
			window.clearInterval(this.interval)
			this.interval = undefined
		}
		await this.running
		await device.blankDevice(true, true)
	}

	public async controlDown(_device: LoupedeckDevice, _info: LoupedeckControlInfo): Promise<void> {
		// Nothing to do
	}
	public async controlUp(_device: LoupedeckDevice, _info: LoupedeckControlInfo): Promise<void> {
		// Nothing to do
	}
	public async controlRotate(_device: LoupedeckDevice, _info: LoupedeckControlInfo, _delta: number): Promise<void> {
		// Nothing to do
	}
	public async touchStart(_device: LoupedeckDevice, _event: LoupedeckTouchEventData): Promise<void> {
		// Nothing to do
	}
	public async touchMove(_device: LoupedeckDevice, _event: LoupedeckTouchEventData): Promise<void> {
		// Nothing to do
	}
	public async touchEnd(_device: LoupedeckDevice, _event: LoupedeckTouchEventData): Promise<void> {
		// Nothing to do
	}
}
