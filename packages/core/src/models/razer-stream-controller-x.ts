import { LoupedeckControlType, LoupedeckDisplayId } from '../constants'
import { LoupedeckSerialConnection } from '../serial'
import { LoupedeckDisplayDefinition, LoupedeckDeviceBase, LoupedeckDeviceOptions, ModelSpec } from './base'
import { LoupedeckModelId } from '../info'

const DisplayCenter: LoupedeckDisplayDefinition = {
	width: 480,
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

	protected get displayMain(): Readonly<LoupedeckDisplayDefinition> {
		return DisplayCenter
	}

	public get modelId(): LoupedeckModelId {
		return LoupedeckModelId.RazerStreamControllerX
	}
	public get modelName(): string {
		return 'Razer Stream Controller X'
	}

	public override get lcdKeySize(): number {
		return 78
	}

	public get lcdKeyColumns(): number {
		return 5
	}
	public get lcdKeyRows(): number {
		return 3
	}

	protected override createBufferWithHeader(
		displayId: LoupedeckDisplayId,
		width: number,
		height: number,
		x: number,
		y: number
	): [buffer: Buffer, offset: number] {
		// The Razer Stream Controller X only has one screen object

		if (displayId !== LoupedeckDisplayId.Center) {
			throw new Error('Unknown DisplayId')
		}

		return super.createBufferWithHeader(displayId, width, height, x, y)
	}

	protected override onTouch(_event: 'touchmove' | 'touchend' | 'touchstart', _buff: Buffer): void {
		// Not supported by device
	}
}
