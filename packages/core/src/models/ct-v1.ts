import { LoupedeckModelId } from '..'
import { LoupedeckSerialConnection } from '../serial'
import { LoupedeckDeviceBase, LoupedeckDeviceOptions, ModelSpec } from './base'
import { LoupedeckCtV2ModelSpec } from './ct-v2'

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
