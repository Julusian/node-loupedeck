import type { LoupedeckSerialConnection } from '../serial.js'
import { LoupedeckDeviceBase, type LoupedeckDeviceOptions, type ModelSpec } from './base.js'
import { LoupedeckModelId } from '../info.js'
import type { LoupedeckDisplayDefinition } from './interface.js'
import { freezeDefinitions, generateButtonGrid } from '../controlsGenerator.js'

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
	lcdKeySize: 78,
}

modelSpec.controls.push(
	...generateButtonGrid(modelSpec, {
		rows: 3,
		columns: 5,
		colOffset: 0,
		startEncodedIndex: 0x1b,
	})
)

freezeDefinitions(modelSpec.controls)

export class RazerStreamControllerDeviceX extends LoupedeckDeviceBase {
	constructor(connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions) {
		super(connection, options, modelSpec)
	}

	protected override onTouch(_event: 'touchmove' | 'touchend' | 'touchstart', _buff: Uint8Array): void {
		// Not supported by device
	}
}
