import { LoupedeckControlType } from '../constants.js'
import type { LoupedeckSerialConnection } from '../serial.js'
import { LoupedeckDeviceBase, type LoupedeckDeviceOptions, type ModelSpec } from './base.js'
import { LoupedeckModelId } from '../info.js'
import type { LoupedeckDisplayDefinition } from './interface.js'

const DisplayCenter: LoupedeckDisplayDefinition = {
	width: 480 - 18 * 2,
	height: 270 - 5 * 2,
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
	constructor(connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions) {
		super(connection, options, modelSpec)
	}
}
