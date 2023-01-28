import { LoupedeckTouchObject } from '../events'
import { LoupedeckControlType, LoupedeckDisplayId } from '../constants'
import { LoupedeckSerialConnection } from '../serial'
import { LoupedeckDisplayDefinition, LoupedeckDeviceBase, LoupedeckDeviceOptions } from './base'
import { LoupedeckControlDefinition } from './interface'
import { LoupedeckModelId } from '../info'

const DisplayCenter: LoupedeckDisplayDefinition = {
	id: LoupedeckDisplayId.Center,
	width: 480,
	height: 270,
	encoded: Buffer.from([0x00, 0x4d]),
	xPadding: 15, // There is some deadspace before the first button
}

const Controls: LoupedeckControlDefinition[] = []
for (let i = 0; i < 2; i++) {
	Controls.push({
		type: LoupedeckControlType.Rotary,
		index: i,
		encoded: 0x01 + i,
	})
}
for (let i = 0; i < 4; i++) {
	Controls.push({
		type: LoupedeckControlType.Button,
		index: i,
		encoded: 0x07 + i,
	})
}

export class LoupedeckLiveSDevice extends LoupedeckDeviceBase {
	private readonly touches: Record<number, LoupedeckTouchObject> = {}

	constructor(connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions) {
		super(connection, options, [DisplayCenter], Controls)
	}

	public get modelId(): LoupedeckModelId {
		return LoupedeckModelId.LoupedeckLiveS
	}
	public get modelName(): string {
		return 'Loupedeck Live S'
	}

	public get lcdKeyColumns(): number {
		return 5
	}
	public get lcdKeyRows(): number {
		return 3
	}

	protected override convertKeyIndexToCoordinates(index: number): [x: number, y: number] {
		const cols = this.lcdKeyColumns

		const width = this.lcdKeySize
		const height = this.lcdKeySize
		const x = (index % cols) * width
		const y = Math.floor(index / cols) * height

		return [x, y]
	}

	protected override onTouch(event: 'touchmove' | 'touchend' | 'touchstart', buff: Buffer): void {
		const x = buff.readUInt16BE(1)
		const y = buff.readUInt16BE(3)
		const id = buff.readUInt8(5)
		// Determine target

		const screen = DisplayCenter.id

		const column = Math.floor((x - DisplayCenter.xPadding) / this.lcdKeySize)
		const row = Math.floor(y / this.lcdKeySize)
		const key = row * this.lcdKeyColumns + column

		// Create touch
		const touch: LoupedeckTouchObject = { x, y, id, target: { screen, key } }

		// End touch, remove from local cache
		if (event === 'touchend') {
			delete this.touches[touch.id]
		} else {
			// First time seeing this touch, emit touchstart instead of touchmove
			if (!this.touches[touch.id]) event = 'touchstart'
			this.touches[touch.id] = touch
		}

		this.emit(event, { touches: Object.values(this.touches), changedTouches: [touch] })
	}
}
