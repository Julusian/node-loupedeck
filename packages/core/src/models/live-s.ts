import { LoupedeckTouchObject } from '../events'
import { LoupedeckControlType, LoupedeckDisplayId } from '../constants'
import { LoupedeckSerialConnection } from '../serial'
import { LoupedeckDisplayDefinition, LoupedeckDeviceBase, LoupedeckDeviceOptions, ModelSpec } from './base'
import { LoupedeckModelId } from '../info'

const DisplayCenter: LoupedeckDisplayDefinition = {
	width: 480 - 18 * 2,
	height: 270,
	xPadding: 18, // There is some deadspace before the first button
	yPadding: 5,
	columnGap: 10,
	rowGap: 10,
}

const modelSpec: ModelSpec = {
	controls: [],

	displayMain: DisplayCenter,
	displayLeftStrip: undefined,
	displayRightStrip: undefined,

	modelId: LoupedeckModelId.LoupedeckLiveS,
	modelName: 'Loupedeck Live S',
	lcdKeySize: 80,
	lcdKeyColumns: 5,
	lcdKeyRows: 3,
}

for (let i = 0; i < 2; i++) {
	modelSpec.controls.push({
		type: LoupedeckControlType.Rotary,
		index: i,
		encoded: 0x01 + i,
	})
}
for (let i = 0; i < 4; i++) {
	modelSpec.controls.push({
		type: LoupedeckControlType.Button,
		index: i,
		encoded: 0x07 + i,
	})
}

export class LoupedeckLiveSDevice extends LoupedeckDeviceBase {
	private readonly touches: Record<number, LoupedeckTouchObject> = {}

	constructor(connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions) {
		super(connection, options, modelSpec)
	}

	protected override onTouch(event: 'touchmove' | 'touchend' | 'touchstart', buff: Buffer): void {
		const x = buff.readUInt16BE(1)
		const y = buff.readUInt16BE(3)
		const id = buff.readUInt8(5)
		// Determine target

		const screen = LoupedeckDisplayId.Center

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

		this.emit(event, { touches: Object.values<LoupedeckTouchObject>(this.touches), changedTouches: [touch] })
	}
}
