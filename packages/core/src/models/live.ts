import type { LoupedeckSerialConnection } from '../serial.js'
import { LoupedeckDeviceBase, type LoupedeckDeviceOptions, type ModelSpec } from './base.js'
import { LoupedeckModelId } from '../info.js'
import type { LoupedeckDisplayDefinition } from './interface.js'
import {
	freezeDefinitions,
	generateButtonGrid,
	generateButtonsRow,
	generateTopScreenEncoders,
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

const modelSpec: ModelSpec = {
	controls: [],

	displayMain: DisplayCenter,
	displayLeftStrip: DisplayLeft,
	displayRightStrip: DisplayRight,

	modelId: LoupedeckModelId.LoupedeckLive,
	modelName: 'Loupedeck Live',
	lcdKeySize: 80,
}

modelSpec.controls.push(
	...generateButtonsRow(0x07),
	...generateTopScreenEncoders(0x01),

	...generateButtonGrid(modelSpec, {
		rows: 3,
		columns: 4,
		colOffset: 2,
		startEncodedIndex: null,
	})
)

freezeDefinitions(modelSpec.controls)

export class LoupedeckLiveDevice extends LoupedeckDeviceBase {
	constructor(connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions) {
		super(connection, options, modelSpec)
	}
}
