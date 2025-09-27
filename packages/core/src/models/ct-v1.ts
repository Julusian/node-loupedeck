import { LoupedeckModelId } from '../info.js'
import type { LoupedeckSerialConnection } from '../serial.js'
import { LoupedeckDeviceBase, type LoupedeckDeviceOptions, type ModelSpec } from './base.js'
import { LoupedeckCtV2ModelSpec } from './ct-v2.js'

const LoupedeckCtV1ModelSpec: ModelSpec = {
	...LoupedeckCtV2ModelSpec,
	splitTopDisplays: true,
	modelId: LoupedeckModelId.LoupedeckCtV1,

	framebufferFlush: true,
}

export class LoupedeckCtDeviceV1 extends LoupedeckDeviceBase {
	constructor(connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions) {
		super(connection, options, LoupedeckCtV1ModelSpec)
	}
}
