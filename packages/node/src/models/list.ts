import { VendorIdLoupedeck, VendorIdRazer } from '../constants'
import { LoupedeckModelId } from '../info'
import { LoupedeckDeviceOptions } from './base'
import { LoupedeckLiveDevice } from './live'
import { LoupedeckSerialConnection } from '../serial'
import { RazerStreamControllerDevice } from './razer-stream-controller'
import { LoupedeckDevice } from './interface'

export interface DeviceModelSpec {
	id: LoupedeckModelId
	vendorId: number
	productId: number
	class: new (connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions) => LoupedeckDevice
}

/** List of all the known models, and the classes to use them */
export const DEVICE_MODELS: DeviceModelSpec[] = [
	{
		id: LoupedeckModelId.LoupedeckLive,
		vendorId: VendorIdLoupedeck,
		productId: 0x0004,
		class: LoupedeckLiveDevice,
	},
	{
		id: LoupedeckModelId.RazerStreamController,
		vendorId: VendorIdRazer,
		productId: 0x0d06,
		class: RazerStreamControllerDevice,
	},
]
