import type { LoupedeckDisplayId } from './constants.js'
import type { LoupedeckControlDefinition } from './controlDefinition.js'

export type LoupedeckDeviceEvents = {
	error: [error: Error]
	down: [info: LoupedeckControlDefinition]
	up: [info: LoupedeckControlDefinition]
	rotate: [info: LoupedeckControlDefinition, delta: number]
	touchstart: [data: LoupedeckTouchEventData]
	touchmove: [data: LoupedeckTouchEventData]
	touchend: [data: LoupedeckTouchEventData]
}

export interface LoupedeckTouchLocation {
	row: number
	column: number
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
		/** Location of key touched, if on `center` screen */
		key: LoupedeckTouchLocation | undefined
	}
}
export interface LoupedeckTouchEventData {
	changedTouches: LoupedeckTouchObject[]
	touches: LoupedeckTouchObject[]
}
