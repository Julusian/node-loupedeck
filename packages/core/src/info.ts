export enum LoupedeckModelId {
	LoupedeckCtV1 = 'loupedeck-ct-v1',
	LoupedeckCtV2 = 'loupedeck-ct-v2',
	LoupedeckLive = 'loupedeck-live',
	LoupedeckLiveS = 'loupedeck-live-s',
	RazerStreamController = 'razer-stream-controller',
	RazerStreamControllerX = 'razer-stream-controller-x',
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
