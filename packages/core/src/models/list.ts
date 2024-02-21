import { VendorIdLoupedeck, VendorIdRazer } from '../constants'
import { LoupedeckModelId } from '../info'
import { LoupedeckDeviceOptions } from './base'
import { LoupedeckLiveDevice } from './live'
import { LoupedeckSerialConnection } from '../serial'
import { RazerStreamControllerDevice } from './razer-stream-controller'
import { LoupedeckDevice } from './interface'
import { LoupedeckLiveSDevice } from './live-s'
import { LoupedeckCtDeviceV2 } from './ct-v2'
import { RazerStreamControllerDeviceX } from './razer-stream-controller-x'
import { LoupedeckCtDeviceV1 } from './ct-v1'

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
		id: LoupedeckModelId.LoupedeckCt,
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
