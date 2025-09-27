import type { LoupedeckSerialConnection } from '../serial.js'
import { LoupedeckDeviceBase, type LoupedeckDeviceOptions, type ModelSpec } from './base.js'
import { LoupedeckModelId } from '../info.js'
import type { LoupedeckDisplayDefinition } from './interface.js'
import { freezeDefinitions, generateButtonGrid } from '../controlsGenerator.js'

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
}

// Left stack
modelSpec.controls.push(
	{
		type: 'encoder',
		id: 'encoder-0-0',
		row: 0,
		column: 0,
		encodedIndex: 0x01,
	},
	{
		type: 'encoder',
		id: 'encoder-1-0',
		row: 1,
		column: 0,
		encodedIndex: 0x02,
	},
	{
		type: 'button',
		id: 'button-2-0',
		row: 2,
		column: 0,
		encodedIndex: 0x07,
		feedbackType: 'rgb',
	}
)

// Right stack
for (let i = 0; i < 3; i++) {
	modelSpec.controls.push({
		type: 'button',
		id: `button-${i}-6`,
		row: i,
		column: 6,
		encodedIndex: 0x08 + i,
		feedbackType: 'rgb',
	})
}

modelSpec.controls.push(
	...generateButtonGrid(modelSpec, {
		rows: 3,
		columns: 5,
		colOffset: 1,
		startEncodedIndex: null,
	})
)

freezeDefinitions(modelSpec.controls)

export class LoupedeckLiveSDevice extends LoupedeckDeviceBase {
	constructor(connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions) {
		super(connection, options, modelSpec)
	}
}
