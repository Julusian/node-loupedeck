import { VendorIdLoupedeck } from '../constants'
import { LoupedeckModelId } from '../info'
import { LoupedeckDeviceOptions } from './base'
import { LoupedeckLiveDevice } from './live'
import { LoupedeckSerialConnection } from '../serial'

export interface DeviceModelSpec {
	id: LoupedeckModelId
	vendorId: number
	productId: number
	class: new (connection: LoupedeckSerialConnection, options: LoupedeckDeviceOptions) => LoupedeckLiveDevice
}

/** List of all the known models, and the classes to use them */
export const DEVICE_MODELS: DeviceModelSpec[] = [
	{
		id: LoupedeckModelId.LoupedeckLive,
		vendorId: VendorIdLoupedeck,
		productId: 0x0004,
		class: LoupedeckLiveDevice,
	},
]
