import { LoupedeckDevice, LoupedeckDeviceOptions } from '@loupedeck/core'
import { DEVICE_MODELS } from '@loupedeck/core/dist/internal'
import { LoupedeckWebSerialConnection } from './serial'
export * from '@loupedeck/core'

const serialFilters: SerialPortFilter[] = DEVICE_MODELS.map((model) => ({
	usbProductId: model.productId,
	usbVendorId: model.vendorId,
}))

/**
 * Request the user to select some streamdecks to open
 * @param userOptions Options to customise the device behvaiour
 */
export async function requestLoupedeck(options?: LoupedeckDeviceOptions): Promise<LoupedeckDevice> {
	// TODO what happens if the user cancels?
	const browserDevice = await navigator.serial.requestPort({
		filters: serialFilters,
	})

	return openDevice(browserDevice, options)
}

/**
 * Reopen previously selected streamdecks.
 * The browser remembers what the user previously allowed your site to access, and this will open those without the request dialog
 * @param options Options to customise the device behvaiour
 */
export async function getLoupedecks(options?: LoupedeckDeviceOptions): Promise<LoupedeckDevice[]> {
	const browserDevices = await navigator.serial.getPorts()
	if (browserDevices.length === 0) {
		return []
	}

	const validIds = new Set<string>()
	for (const model of DEVICE_MODELS) {
		validIds.add(`${model.vendorId}-${model.productId}`)
	}

	const validDevices = browserDevices.filter((dev) => {
		const portInfo = dev.getInfo()
		return validIds.has(`${portInfo.usbVendorId}-${portInfo.usbProductId}`)
	})

	const resultDevices = await Promise.all(
		validDevices.map(async (dev) => openDevice(dev, options).catch((_) => null)) // Ignore failures
	)

	return resultDevices.filter((v): v is LoupedeckDevice => !!v)
}

/**
 * Open a StreamDeck from a manually selected HIDDevice handle
 * @param browserPort The unopened browser HIDDevice
 * @param userOptions Options to customise the device behvaiour
 */
export async function openDevice(
	browserPort: SerialPort,
	userOptions?: LoupedeckDeviceOptions
): Promise<LoupedeckDevice> {
	const portInfo = browserPort.getInfo()

	const model = DEVICE_MODELS.find(
		(m) => m.productId === portInfo.usbProductId && m.vendorId === portInfo.usbVendorId
	)
	if (!model) {
		throw new Error('Stream Deck is of unexpected type.')
	}

	const serialPort = await LoupedeckWebSerialConnection.open(browserPort)

	// await browserDevice.open()

	const options: LoupedeckDeviceOptions = userOptions ?? {}

	const device: LoupedeckDevice = new model.class(serialPort, options || {})

	// return new StreamDeckWeb(device)
	return device
}
