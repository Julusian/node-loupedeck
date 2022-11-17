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

const DisplayLeft: LoupedeckDisplayDefinition = {
	id: LoupedeckDisplayId.Left,
	width: 60,
	height: 270,
	encoded: Buffer.from('\x00L'),
	xPadding: 0,
}
const DisplayCenter: LoupedeckDisplayDefinition = {
	id: LoupedeckDisplayId.Center,
	width: 360,
	height: 270,
	encoded: Buffer.from('\x00A'),
	xPadding: 0,
}
const DisplayRight: LoupedeckDisplayDefinition = {
	id: LoupedeckDisplayId.Right,
	width: 60,
	height: 270,
	encoded: Buffer.from('\x00R'),
	xPadding: 0,
}
const Displays: LoupedeckDisplayDefinition[] = [DisplayLeft, DisplayCenter, DisplayRight]

const Controls: LoupedeckControlDefinition[] = []
for (let i = 0; i < 8; i++) {
	Controls.push({
		type: LoupedeckControlType.Button,
		index: i,
		encoded: 0x07 + i,
	})
}
for (let i = 0; i < 6; i++) {
	Controls.push({
		type: LoupedeckControlType.Rotary,
		index: i,
		encoded: 0x01 + i,
	})
}

export class LoupedeckLiveDevice extends LoupedeckDeviceBase {
	private readonly touches: Record<number, LoupedeckTouchObject> = {}

	constructor(connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions) {
		super(connection, options, Displays, Controls)
	}

	public get modelId(): LoupedeckModelId {
		return LoupedeckModelId.LoupedeckLive
	}
	public get modelName(): string {
		return 'Loupedeck Live'
	}

	protected override onTouch(event: 'touchmove' | 'touchend' | 'touchstart', buff: Buffer): void {
		const x = buff.readUInt16BE(1)
		const y = buff.readUInt16BE(3)
		const id = buff.readUInt8(5)
		// Determine target

		const screen =
			x < 60 ? LoupedeckDisplayId.Left : x >= 420 ? LoupedeckDisplayId.Right : LoupedeckDisplayId.Center
		let key: number | undefined
		if (screen === LoupedeckDisplayId.Center) {
			const column = Math.floor((x - 60) / 90)
			const row = Math.floor(y / 90)
			key = row * 4 + column
		}

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
