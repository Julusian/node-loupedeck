import { VendorIdLoupedeck, VendorIdRazer } from '../constants.js'
import { LoupedeckModelId } from '../info.js'
import type { LoupedeckDeviceOptions } from './base.js'
import { LoupedeckLiveDevice } from './live.js'
import type { LoupedeckSerialConnection } from '../serial.js'
import { RazerStreamControllerDevice } from './razer-stream-controller.js'
import type { LoupedeckDevice } from './interface.js'
import { LoupedeckLiveSDevice } from './live-s.js'
import { LoupedeckCtDeviceV2 } from './ct-v2.js'
import { RazerStreamControllerDeviceX } from './razer-stream-controller-x.js'
import { LoupedeckCtDeviceV1 } from './ct-v1.js'

export interface DeviceModelSpec {
	id: LoupedeckModelId
	vendorId: number
	productId: number
	class: new (connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions) => LoupedeckDevice
}

/** List of all the known models, and the classes to use them */
export const DEVICE_MODELS: DeviceModelSpec[] = [
	{
		id: LoupedeckModelId.LoupedeckCtV1,
		vendorId: VendorIdLoupedeck,
		productId: 0x0003,
		class: LoupedeckCtDeviceV1,
	},
	{
		id: LoupedeckModelId.LoupedeckCtV2,
		vendorId: VendorIdLoupedeck,
		productId: 0x0007,
		class: LoupedeckCtDeviceV2,
	},
	{
		id: LoupedeckModelId.LoupedeckLive,
		vendorId: VendorIdLoupedeck,
		productId: 0x0004,
		class: LoupedeckLiveDevice,
	},
	{
		id: LoupedeckModelId.LoupedeckLiveS,
		vendorId: VendorIdLoupedeck,
		productId: 0x0006,
		class: LoupedeckLiveSDevice,
	},
	{
		id: LoupedeckModelId.RazerStreamController,
		vendorId: VendorIdRazer,
		productId: 0x0d06,
		class: RazerStreamControllerDevice,
	},
	{
		id: LoupedeckModelId.RazerStreamControllerX,
		vendorId: VendorIdRazer,
		productId: 0x0d09,
		class: RazerStreamControllerDeviceX,
	},
]
