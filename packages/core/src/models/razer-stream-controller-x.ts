import { LoupedeckControlType, LoupedeckDisplayId } from '../constants'
import { LoupedeckSerialConnection } from '../serial'
import { LoupedeckDisplayDefinition, LoupedeckDeviceBase, LoupedeckDeviceOptions } from './base'
import { LoupedeckModelId } from '../info'
import { LoupedeckControlDefinition } from './interface'

const DisplayCenter: LoupedeckDisplayDefinition = {
	id: LoupedeckDisplayId.Center,
	width: 480,
	height: 270,
	encoded: Buffer.from([0x00, 0x4d]),
	xPadding: 5,
	yPadding: 0,
	columnGap: 20,
	rowGap: 18,
}
const Displays: LoupedeckDisplayDefinition[] = [DisplayCenter]

const Controls: LoupedeckControlDefinition[] = []
for (let i = 0; i < 15; i++) {
	Controls.push({
		type: LoupedeckControlType.Button,
		index: i,
		encoded: 0x1b + i,
	})
}
export class RazerStreamControllerDeviceX extends LoupedeckDeviceBase {
	constructor(connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions) {
		super(connection, options, Displays, Controls)
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
		display: LoupedeckDisplayDefinition,
		width: number,
		height: number,
		x: number,
		y: number
	): [buffer: Buffer, offset: number] {
		// The Razer Stream Controller X only has one screen object

		if (display.id !== DisplayCenter.id) {
			throw new Error('Unknown DisplayId')
		}

		return super.createBufferWithHeader(display, width, height, x, y)
	}

	protected override onTouch(_event: 'touchmove' | 'touchend' | 'touchstart', _buff: Buffer): void {
		// Not supported by device
	}
}
