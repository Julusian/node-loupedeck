import { assertNever } from './util.js'

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

export function getModelName(modelId: LoupedeckModelId): string {
	switch (modelId) {
		case LoupedeckModelId.LoupedeckCtV1:
		case LoupedeckModelId.LoupedeckCtV2:
			return 'Loupedeck CT'
		case LoupedeckModelId.LoupedeckLive:
			return 'Loupedeck Live'
		case LoupedeckModelId.LoupedeckLiveS:
			return 'Loupedeck Live S'
		case LoupedeckModelId.RazerStreamController:
			return 'Razer Stream Controller'
		case LoupedeckModelId.RazerStreamControllerX:
			return 'Razer Stream Controller X'
		default:
			assertNever(modelId)
			return 'Unknown Loupedeck Model'
	}
}
