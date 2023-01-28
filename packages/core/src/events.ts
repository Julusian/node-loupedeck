import { LoupedeckControlType, LoupedeckDisplayId } from './constants'

export type LoupedeckDeviceEvents = {
	error: [error: Error]
	down: [info: LoupedeckControlInfo]
	up: [info: LoupedeckControlInfo]
	rotate: [info: LoupedeckControlInfo, delta: number]
	touchstart: [data: LoupedeckTouchEventData]
	touchmove: [data: LoupedeckTouchEventData]
	touchend: [data: LoupedeckTouchEventData]
}

export interface LoupedeckControlInfo {
	type: LoupedeckControlType
	index: number
}

export interface LoupedeckTouchObject {
	/** Unique touch identifier */
	id: number
	/** Screen X-coordinate */
	x: number
	/** Screen Y-coordinate */
	y: number

	target: {
		/** Identifier of screen this touch was detected on */
		screen: LoupedeckDisplayId
		/** Index of key touched ([0-11]), if on `center` screen */
		key: number | undefined
	}
}
export interface LoupedeckTouchEventData {
	changedTouches: LoupedeckTouchObject[]
	touches: LoupedeckTouchObject[]
}
