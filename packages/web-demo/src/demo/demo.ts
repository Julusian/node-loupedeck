import { LoupedeckControlInfo, LoupedeckDevice, LoupedeckTouchEventData } from '@loupedeck/web'

export interface Demo {
	start(device: LoupedeckDevice): Promise<void>
	stop(device: LoupedeckDevice): Promise<void>

	controlDown(device: LoupedeckDevice, info: LoupedeckControlInfo): Promise<void>
	controlUp(device: LoupedeckDevice, info: LoupedeckControlInfo): Promise<void>

	controlRotate(device: LoupedeckDevice, info: LoupedeckControlInfo, delta: number): Promise<void>

	touchStart(device: LoupedeckDevice, event: LoupedeckTouchEventData): Promise<void>
	touchMove(device: LoupedeckDevice, event: LoupedeckTouchEventData): Promise<void>
	touchEnd(device: LoupedeckDevice, event: LoupedeckTouchEventData): Promise<void>
}
