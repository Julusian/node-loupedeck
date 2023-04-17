import { LoupedeckTouchObject } from '../events'
import { LoupedeckControlType, LoupedeckDisplayId } from '../constants'
import { LoupedeckSerialConnection } from '../serial'
import { LoupedeckDisplayDefinition, LoupedeckDeviceBase, LoupedeckDeviceOptions, ModelSpec } from './base'
import { LoupedeckModelId } from '../info'

const DisplayLeft: LoupedeckDisplayDefinition = {
	width: 60,
	height: 270,
	xPadding: 0,
	yPadding: 0,
	columnGap: 0,
	rowGap: 0,
}
const DisplayCenter: LoupedeckDisplayDefinition = {
	width: 360,
	height: 270,
	xPadding: 5,
	yPadding: 5,
	columnGap: 10,
	rowGap: 10,
}
const DisplayRight: LoupedeckDisplayDefinition = {
	width: 60,
	height: 270,
	xPadding: 0,
	yPadding: 0,
	columnGap: 0,
	rowGap: 0,
}

const modelSpec: ModelSpec = {
	controls: [],

	displayMain: DisplayCenter,
	displayLeftStrip: DisplayLeft,
	displayRightStrip: DisplayRight,

	modelId: LoupedeckModelId.RazerStreamController,
	modelName: 'Razer Stream Controller',
	lcdKeySize: 80,
	lcdKeyColumns: 4,
	lcdKeyRows: 3,
}

for (let i = 0; i < 8; i++) {
	modelSpec.controls.push({
		type: LoupedeckControlType.Button,
		index: i,
		encoded: 0x07 + i,
	})
}
for (let i = 0; i < 6; i++) {
	modelSpec.controls.push({
		type: LoupedeckControlType.Rotary,
		index: i,
		encoded: 0x01 + i,
	})
}

export class RazerStreamControllerDevice extends LoupedeckDeviceBase {
	private readonly touches: Record<number, LoupedeckTouchObject> = {}

	constructor(connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions) {
		super(connection, options, modelSpec)
	}

	protected override createBufferWithHeader(
		displayId: LoupedeckDisplayId,
		width: number,
		height: number,
		x: number,
		y: number
	): [buffer: Buffer, offset: number] {
		// The Razer Stream Controller only has one screen object, so we need to remap the pixel addresses

		if (displayId === LoupedeckDisplayId.Left) {
			// Nothing to do
		} else if (displayId === LoupedeckDisplayId.Center) {
			x += DisplayLeft.width
		} else if (displayId === LoupedeckDisplayId.Right) {
			x += DisplayLeft.width + DisplayCenter.width
		} else {
			throw new Error('Unknown DisplayId')
		}

		return super.createBufferWithHeader(displayId, width, height, x, y)
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
			const column = Math.floor((x - 60) / this.lcdKeySize)
			const row = Math.floor(y / this.lcdKeySize)
			key = row * this.lcdKeyColumns + column
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

		this.emit(event, { touches: Object.values<LoupedeckTouchObject>(this.touches), changedTouches: [touch] })
	}
}
