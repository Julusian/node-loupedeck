import { EventEmitter } from 'eventemitter3'

export type LoupedeckSerialConnectionEvents = {
	disconnect: []
	error: [err: Error]
	message: [msg: Uint8Array]
}

export abstract class LoupedeckSerialConnection extends EventEmitter<LoupedeckSerialConnectionEvents> {
	public abstract close(): Promise<void>

	public abstract isReady(): boolean

	public abstract send(buff: Uint8Array): Promise<void>
}
