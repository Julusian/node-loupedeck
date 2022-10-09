export enum LoupedeckModelId {
	LoupedeckLive = 'loupedeck-live',
}

/**
 * Information about a found loupedeck
 */
export interface LoupedeckDeviceInfo {
	/** The model of the device */
	model: LoupedeckModelId
	/** The connected path of the device in the usb tree */
	path: string
	/** The serialNumber of the device. If set it can be used as a unique hardware identifier */
	serialNumber?: string
}
