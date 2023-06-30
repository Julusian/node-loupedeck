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
const DisplayWheel: LoupedeckDisplayDefinition = {
	width: 240,
	height: 240,
	xPadding: 0,
	yPadding: 0,
	columnGap: 0,
	rowGap: 0,
	endianness: 'BE',
}

const modelSpec: ModelSpec = {
	controls: [],

	displayMain: DisplayCenter,
	displayLeftStrip: DisplayLeft,
	displayRightStrip: DisplayRight,
	displayWheel: DisplayWheel,

	modelId: LoupedeckModelId.LoupedeckCt,
	modelName: 'Loupedeck CT',
	lcdKeySize: 80,
	lcdKeyColumns: 4,
	lcdKeyRows: 3,
}

for (let i = 0; i < 8; i++) {
	// round buttons
	modelSpec.controls.push({
		type: LoupedeckControlType.Button,
		index: i,
		encoded: 0x07 + i,
	})
}
for (let i = 0; i < 12; i++) {
	// square buttons
	modelSpec.controls.push({
		type: LoupedeckControlType.Button,
		index: i + 8,
		encoded: 0x0f + i,
	})
}
for (let i = 0; i < 6; i++) {
	// small rotary encoders
	modelSpec.controls.push({
		type: LoupedeckControlType.Rotary,
		index: i,
		encoded: 0x01 + i,
	})
}
// big wheel encoder
modelSpec.controls.push({
	type: LoupedeckControlType.Rotary,
	index: 6,
	encoded: 0x00,
})

export class LoupedeckCtDevice extends LoupedeckDeviceBase {
	constructor(connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions) {
		super(connection, options, modelSpec)
	}
}
