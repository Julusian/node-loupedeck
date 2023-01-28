import { EventEmitter } from 'eventemitter3'

export type LoupedeckSerialConnectionEvents = {
	disconnect: []
	error: [err: Error]
	message: [msg: Buffer]
}

export abstract class LoupedeckSerialConnection extends EventEmitter<LoupedeckSerialConnectionEvents> {
	public abstract close(): Promise<void>

	public abstract isReady(): boolean

	public abstract send(buff: Buffer): Promise<void>
}
