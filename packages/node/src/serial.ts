import { SerialPort, PacketLengthParser } from 'serialport'
import { LoupedeckSerialConnection } from '@loupedeck/core'
import {
	WS_UPGRADE_RESPONSE,
	WS_UPGRADE_HEADER,
	createSerialPacketHeaderPacket,
} from '@loupedeck/core/dist/internal.js'

export class LoupedeckNodeSerialConnection extends LoupedeckSerialConnection {
	private connection: SerialPort | undefined

	private constructor(connection: SerialPort) {
		super()

		this.connection = connection

		this.connection.on('error', (err) => {
			this.emit('error', err)
		})
		this.connection.on('close', () => {
			this.emit('disconnect')
		})

		// Set up data pipeline
		const parser = new PacketLengthParser({ delimiter: 0x82 })
		this.connection.pipe(parser)
		parser.on('data', (msg: Uint8Array) => this.emit('message', msg))
	}

	public static async open(path: string): Promise<LoupedeckSerialConnection> {
		const connection = new SerialPort({ path: path, baudRate: 256000, autoOpen: false })

		await new Promise<void>((resolve, reject) => {
			connection.open((err) => {
				if (err) reject(err)
				else resolve()
			})
		})

		// Wait for the "websocket" handshake over serial (...)
		await new Promise<void>((resolve, reject) => {
			connection.once('data', (buff) => {
				if (buff.toString().startsWith(WS_UPGRADE_RESPONSE)) resolve()
				else reject(`Invalid handshake response: ${buff.toString()}`)
			})
			connection.write(WS_UPGRADE_HEADER)

			setTimeout(() => {
				reject(new Error('Timed out'))
			}, 5000)
		})

		return new LoupedeckNodeSerialConnection(connection)
	}

	public override async close(): Promise<void> {
		if (!this.connection) return
		if (!this.connection.isOpen) this.connection.close()
		delete this.connection
	}

	public override isReady(): boolean {
		return this.connection !== undefined && this.connection.isOpen
	}

	public override async send(buff: Uint8Array, raw = false): Promise<void> {
		if (!this.connection) throw new Error('Not connected!')

		if (!raw) {
			const prep = createSerialPacketHeaderPacket(buff)
			this.connection.write(prep)
		}
		this.connection.write(buff)
	}
}
