import { LoupedeckDevice } from './models/interface'
import { LoupedeckSerialConnection } from './serial'
import { SerialPort } from 'serialport'
import { LoupedeckDeviceInfo } from './info'
import { DEVICE_MODELS } from './models/list'
import { LoupedeckDeviceOptions } from './models/base'

export * from './constants'
export * from './info'
export { LoupedeckLiveDevice } from './models/live'
export { LoupedeckControlDefinition, LoupedeckDeviceOptions, LoupedeckDisplayDefinition } from './models/base'

export { LoupedeckDevice }

/**
 * If the provided device is a loupedeck, get the info about it
 */
export function getLoupedeckDeviceInfo(dev: import('@serialport/bindings-cpp').PortInfo): LoupedeckDeviceInfo | null {
	if (!dev.vendorId || !dev.productId) return null

	const vendorId = parseInt(dev.vendorId, 16)
	const productId = parseInt(dev.productId, 16)

	const model = DEVICE_MODELS.find((mod) => mod.vendorId === vendorId && mod.productId === productId)
	if (!model) return null

	return {
		model: model.id,
		path: dev.path,
		serialNumber: dev.serialNumber,
	}
}

/**
 * Scan for and list detected devices
 */
export async function listLoupedecks(): Promise<LoupedeckDeviceInfo[]> {
	const result: LoupedeckDeviceInfo[] = []
	for (const dev of await SerialPort.list()) {
		const info = getLoupedeckDeviceInfo(dev)
		if (info) result.push(info)
	}
	return result
}

/**
 * Open a loupedeck
 * @param path The path of the device to open
 * @param options Options to customise the device behvaiour
 */
export async function openLoupedeck(path: string, options?: LoupedeckDeviceOptions): Promise<LoupedeckDevice> {
	const devices = await listLoupedecks()
	const selectedDevice = devices.find((dev) => dev.path === path)
	if (!selectedDevice) throw new Error('Device path not found')

	const model = DEVICE_MODELS.find((mod) => mod.id === selectedDevice.model)
	if (!model) throw new Error('Loupedeck is of unexpected type')

	const connection = await LoupedeckSerialConnection.open(selectedDevice.path)

	return new model.class(connection, options || {})
}
