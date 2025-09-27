import { LoupedeckControlType } from '../constants.js'
import type { LoupedeckSerialConnection } from '../serial.js'
import { LoupedeckDeviceBase, type LoupedeckDeviceOptions, type ModelSpec } from './base.js'
import { LoupedeckModelId } from '../info.js'
import type { LoupedeckDisplayDefinition } from './interface.js'

const DisplayCenter: LoupedeckDisplayDefinition = {
	width: 480 - 5 * 2,
	height: 270,
	xPadding: 5,
	yPadding: 0,
	columnGap: 20,
	rowGap: 18,
}

const modelSpec: ModelSpec = {
	controls: [],

	displayMain: DisplayCenter,
	displayLeftStrip: undefined,
	displayRightStrip: undefined,

	modelId: LoupedeckModelId.RazerStreamControllerX,
	modelName: 'Razer Stream Controller X',
	lcdKeySize: 78,
	lcdKeyColumns: 5,
	lcdKeyRows: 3,
}

for (let i = 0; i < 15; i++) {
	modelSpec.controls.push({
		type: LoupedeckControlType.Button,
		index: i,
		encoded: 0x1b + i,
	})
}
export class RazerStreamControllerDeviceX extends LoupedeckDeviceBase {
	constructor(connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions) {
		super(connection, options, modelSpec)
	}

	protected override onTouch(_event: 'touchmove' | 'touchend' | 'touchstart', _buff: Uint8Array): void {
		// Not supported by device
	}
}
