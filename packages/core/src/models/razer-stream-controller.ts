import { LoupedeckControlType } from '../constants.js'
import { LoupedeckSerialConnection } from '../serial.js'
import { LoupedeckDeviceBase, LoupedeckDeviceOptions, ModelSpec } from './base.js'
import { LoupedeckModelId } from '../info.js'
import type { LoupedeckDisplayDefinition } from './interface.js'

const DisplayLeft: LoupedeckDisplayDefinition = {
	width: 60,
	height: 270,
	xPadding: 0,
	yPadding: 0,
	columnGap: 0,
	rowGap: 0,
}
const DisplayCenter: LoupedeckDisplayDefinition = {
	width: 360 - 5 * 2,
	height: 270 - 5 * 2,
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
	constructor(connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions) {
		super(connection, options, modelSpec)
	}
}
