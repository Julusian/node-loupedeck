export const VendorIdLoupedeck = 0x2ec2
export const VendorIdRazer = 0x1532

export enum LoupedeckVibratePattern {
	SHORT = 0x01,
	MEDIUM = 0x0a,
	LONG = 0x0f,
	LOW = 0x31,
	SHORT_LOW = 0x32,
	SHORT_LOWER = 0x33,
	LOWER = 0x40,
	LOWEST = 0x41,
	DESCEND_SLOW = 0x46,
	DESCEND_MED = 0x47,
	DESCEND_FAST = 0x48,
	ASCEND_SLOW = 0x52,
	ASCEND_MED = 0x53,
	ASCEND_FAST = 0x58,
	REV_SLOWEST = 0x5e,
	REV_SLOW = 0x5f,
	REV_MED = 0x60,
	REV_FAST = 0x61,
	REV_FASTER = 0x62,
	REV_FASTEST = 0x63,
	RISE_FALL = 0x6a,
	BUZZ = 0x70,
	RUMBLE5 = 0x77, // lower frequencies in descending order
	RUMBLE4 = 0x78,
	RUMBLE3 = 0x79,
	RUMBLE2 = 0x7a,
	RUMBLE1 = 0x7b,
	/**
	 *  10 sec high freq (!)
	 */
	VERY_LONG = 0x76,
}

export enum LoupedeckDisplayId {
	Left = 'left',
	Center = 'center',
	Right = 'right',
	Wheel = 'wheel',
}

export const DisplayMainEncodedId = new Uint8Array([0x00, 0x4d])
export const DisplayWheelEncodedId = new Uint8Array([0x00, 0x57])

export const DisplayLeftEncodedId = new Uint8Array([0x00, 0x4c])
export const DisplayCenterEncodedId = new Uint8Array([0x00, 0x41])
export const DisplayRightEncodedId = new Uint8Array([0x00, 0x52])

export interface RGBColor {
	red: number
	green: number
	blue: number
}

export enum LoupedeckBufferFormat {
	RGB = 'rgb',
}
