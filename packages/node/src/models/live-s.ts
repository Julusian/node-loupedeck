import { LoupedeckTouchObject } from '../events'
import { LoupedeckControlType, LoupedeckDisplayId } from '../constants'
import { LoupedeckSerialConnection } from '../serial'
import {
	LoupedeckControlDefinition,
	LoupedeckDisplayDefinition,
	LoupedeckDeviceBase,
	LoupedeckDeviceOptions,
} from './base'
import { LoupedeckModelId } from '..'

const DisplayCenter: LoupedeckDisplayDefinition = {
	id: LoupedeckDisplayId.Center,
	width: 480,
	height: 270,
	encoded: Buffer.from([0x00, 0x4d]),
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

	protected override convertKeyIndexToCoordinates(index: number): [x: number, y: number] {
		const width = 90
		const height = 90
		const x = (index % 5) * width
		const y = Math.floor(index / 5) * height

		return [x, y]
	}

	protected override onTouch(event: 'touchmove' | 'touchend' | 'touchstart', buff: Buffer): void {
		const x = buff.readUInt16BE(1)
		const y = buff.readUInt16BE(3)
		const id = buff.readUInt8(5)
		// Determine target

		const screen = DisplayCenter.id

		const column = Math.floor((x - 15) / 90)
		const row = Math.floor(y / 90)
		const key = row * 5 + column

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
