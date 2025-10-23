import type { LoupedeckSerialConnection } from '../serial.js'
import { LoupedeckDeviceBase, type LoupedeckDeviceOptions, type ModelSpec } from './base.js'
import { LoupedeckModelId } from '../info.js'
import type { LoupedeckDisplayDefinition } from './interface.js'
import {
	freezeDefinitions,
	generateButtonGrid,
	generateButtonsRow,
	generateTopScreenEncoders,
	generateTopScreenLcdStrips,
} from '../controlsGenerator.js'

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

export const LoupedeckCtV2ModelSpec: ModelSpec = {
	controls: [],

	displayMain: DisplayCenter,
	displayLeftStrip: DisplayLeft,
	displayRightStrip: DisplayRight,
	displayWheel: DisplayWheel,

	modelId: LoupedeckModelId.LoupedeckCtV2,
	lcdKeySize: 80,
}

LoupedeckCtV2ModelSpec.controls.push(
	...generateButtonsRow(0x07),
	...generateTopScreenEncoders(0x01),
	...generateTopScreenLcdStrips(1, 6),

	...generateButtonGrid(LoupedeckCtV2ModelSpec, {
		rows: 3,
		columns: 4,
		colOffset: 2,
		startEncodedIndex: null,
	}),

	{
		type: 'button',
		id: 'button-home',
		row: 4,
		column: 0,
		encodedIndex: 0x08,
		feedbackType: 'rgb',
	},
	{
		type: 'button',
		id: 'button-undo',
		row: 5,
		column: 0,
		encodedIndex: 0x09,
		feedbackType: 'rgb',
	},
	{
		type: 'button',
		id: 'button-keyboard',
		row: 6,
		column: 0,
		encodedIndex: 0x0a,
		feedbackType: 'rgb',
	},
	{
		type: 'button',
		id: 'button-return',
		row: 4,
		column: 1,
		encodedIndex: 0x0b,
		feedbackType: 'rgb',
	},
	{
		type: 'button',
		id: 'button-save',
		row: 5,
		column: 1,
		encodedIndex: 0x0c,
		feedbackType: 'rgb',
	},
	{
		type: 'button',
		id: 'button-fn-left',
		row: 6,
		column: 1,
		encodedIndex: 0x0d,
		feedbackType: 'rgb',
	},
	{
		type: 'button',
		id: 'button-up',
		row: 4,
		column: 6,
		encodedIndex: 0x0e,
		feedbackType: 'rgb',
	},
	{
		type: 'button',
		id: 'button-left',
		row: 5,
		column: 6,
		encodedIndex: 0x0f,
		feedbackType: 'rgb',
	},
	{
		type: 'button',
		id: 'button-fn-right',
		row: 6,
		column: 6,
		encodedIndex: 0x10,
		feedbackType: 'rgb',
	},
	{
		type: 'button',
		id: 'button-down',
		row: 4,
		column: 7,
		encodedIndex: 0x11,
		feedbackType: 'rgb',
	},
	{
		type: 'button',
		id: 'button-right',
		row: 5,
		column: 7,
		encodedIndex: 0x12,
		feedbackType: 'rgb',
	},
	{
		type: 'button',
		id: 'button-blank',
		row: 6,
		column: 7,
		encodedIndex: 0x13,
		feedbackType: 'rgb',
	},

	{
		type: 'wheel',
		id: 'wheel',

		row: 4,
		column: 2,

		rowSpan: 3,
		columnSpan: 4,
	}
)

freezeDefinitions(LoupedeckCtV2ModelSpec.controls)

export class LoupedeckCtDeviceV2 extends LoupedeckDeviceBase {
	constructor(connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions) {
		super(connection, options, LoupedeckCtV2ModelSpec)
	}
}
