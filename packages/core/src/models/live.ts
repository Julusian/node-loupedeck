import { LoupedeckControlType } from '../constants'
import { LoupedeckSerialConnection } from '../serial'
import { LoupedeckDeviceBase, LoupedeckDeviceOptions, ModelSpec } from './base'
import { LoupedeckModelId } from '../info'
import { LoupedeckDisplayDefinition } from './interface'

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

	modelId: LoupedeckModelId.LoupedeckLive,
	modelName: 'Loupedeck Live',
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

export class LoupedeckLiveDevice extends LoupedeckDeviceBase {
	constructor(connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions) {
		super(connection, options, modelSpec)
	}
}
