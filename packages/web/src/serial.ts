import { LoupedeckSerialConnection } from '@loupedeck/core'
import {
	WS_UPGRADE_RESPONSE,
	WS_UPGRADE_HEADER,
	createSerialPacketHeaderPacket,
	uint8ArrayToDataView,
} from '@loupedeck/core/internal'

export class LoupedeckWebSerialConnection extends LoupedeckSerialConnection {
	private connection: SerialPort | undefined
	private reader: ReadableStreamDefaultReader<Uint8Array> | undefined
	private writer: WritableStreamDefaultWriter<Uint8Array> | undefined
	private isOpen: boolean

	private constructor(
		connection: SerialPort,
		reader: ReadableStreamDefaultReader<Uint8Array>,
		writer: WritableStreamDefaultWriter<Uint8Array>
	) {
		super()

		this.connection = connection
		this.reader = reader
		this.writer = writer
		this.isOpen = true

		this.connection.addEventListener('error', (err) => {
			this.emit('error', err as any) // TODO
		})
		this.connection.addEventListener('connect', () => {
			console.log('connect')
			this.isOpen = true
			// TODO - will this ever fire in a usable way?
			try {
				this.openReaderWriter()
			} catch (err: any) {
				this.emit('error', err) // TODO
			}
		})
		this.connection.addEventListener('disconnect', () => {
			console.log('disconnect')
			this.isOpen = false
			this.closeReaderWriter()

			this.emit('disconnect')
		})

		this.startReadLoop(this.reader)
	}

	private startReadLoop(reader: ReadableStreamDefaultReader<Uint8Array>) {
		Promise.resolve()
			.then(async () => {
				const parser = new PacketLengthParser({
					delimiter: 0x82,
				})

				while (true) {
					const { value, done } = await reader.read()
					if (value) {
						const chunks = parser.transform(value)
						for (const chunk of chunks) {
							this.emit('message', chunk)
						}
					}

					if (done) {
						// Allow the serial port to be closed later.
						reader.releaseLock()
						break
					}
				}
			})
			.catch((e) => {
				this.emit('error', e)
			})
	}

	private closeReaderWriter() {
		if (this.writer) {
			this.writer.close().catch(() => null)
			delete this.writer
		}
	}

	private openReaderWriter() {
		this.closeReaderWriter()

		if (!this.connection) throw new Error('SerialPort is closed')

		if (!this.connection.writable) throw new Error('SerialPort is not writable')
		if (!this.connection.readable) throw new Error('SerialPort is not readable')
		this.writer = this.connection.writable.getWriter()
		this.reader = this.connection.readable.getReader()

		this.startReadLoop(this.reader)
	}

	public static async open(connection: SerialPort): Promise<LoupedeckSerialConnection> {
		let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
		let writer: WritableStreamDefaultWriter<Uint8Array> | undefined
		try {
			await connection.open({
				baudRate: 256000,
			})

			if (!connection.writable) throw new Error('SerialPort is not writable')
			if (!connection.readable) throw new Error('SerialPort is not readable')
			writer = connection.writable.getWriter()
			reader = connection.readable.getReader()

			// Sometimes the first write gets lost
			let readComplete = false
			const writer2 = writer
			const [firstRead] = await Promise.all([
				reader.read().then((res) => {
					// Inform the write loop to sto
					readComplete = true
					return res
				}),
				new Promise<void>((resolve, reject) => {
					setTimeout(() => {
						// Catchall timeout to abort if it doesn't complete in time
						reject(new Error('Timed out'))
					}, 5000)

					const tick = () => {
						if (readComplete) {
							// Read has finished. Stop repeating the write
							resolve()
						} else {
							// Try writing again
							writer2
								.write(WS_UPGRADE_HEADER)
								.then(() => {
									// Run again
									setTimeout(tick, 10)
								})
								.catch((e) => {
									reject(e instanceof Error ? e : new Error(String(e)))
								})
						}
					}
					tick()
				}),
			]).catch((e) => {
				// If the read failed, stop the write from contuing
				readComplete = true

				// If the write failed, abort the read
				reader?.cancel('Aborted').catch(() => null)

				// Forward the error onwards
				throw e
			})

			if (!firstRead.value) throw new Error(`No handshake response`)

			const responseBuffer = new TextDecoder().decode(firstRead.value)
			if (!responseBuffer.startsWith(WS_UPGRADE_RESPONSE))
				throw new Error(`Invalid handshake response: ${responseBuffer}`)

			return new LoupedeckWebSerialConnection(connection, reader, writer)
		} catch (err) {
			// cleanup any in-progress connection
			connection.close().catch(() => null)
			reader?.cancel('Aborted')?.catch(() => null)
			writer?.abort('Aborted')?.catch(() => null)

			throw err
		}
	}

	public override async close(): Promise<void> {
		if (this.writer) {
			this.writer.close().catch(() => null) // Ignore error
			delete this.writer
		}
		if (this.connection) {
			await this.connection.close().catch(() => null) // Ignore error
			delete this.connection
		}
	}

	public override isReady(): boolean {
		return this.connection !== undefined && this.isOpen
	}

	public override async send(buff: Uint8Array, raw = false): Promise<void> {
		if (!this.connection || !this.writer) throw new Error('Not connected!')

		if (!raw) {
			const prep = createSerialPacketHeaderPacket(buff)
			await this.writer.write(prep)
		}
		await this.writer.write(buff)
	}
}

interface Opts {
	delimiter: number
	packetOverhead: number
	lengthOffset: number
	maxLen: number
}

class PacketLengthParser {
	buffer = new Uint8Array(0)
	start = true
	opts: Opts

	constructor(options: Partial<Opts> = {}) {
		const { delimiter = 0xaa, packetOverhead = 2, lengthOffset = 1, maxLen = 0xff } = options
		this.opts = {
			delimiter,
			packetOverhead,
			lengthOffset,
			maxLen,
		}
	}
	transform(chunk: Uint8Array): Uint8Array[] {
		const chunks: Uint8Array[] = []

		// TODO - this is really really inefficient...

		for (let ndx = 0; ndx < chunk.length; ndx++) {
			const byte = chunk[ndx]
			if (byte === this.opts.delimiter) {
				this.start = true
			}
			if (true === this.start) {
				const oldBuffer = this.buffer
				this.buffer = new Uint8Array(oldBuffer.length + 1)
				const bufferView = uint8ArrayToDataView(this.buffer)

				this.buffer.set(oldBuffer, 0)
				this.buffer[this.buffer.length - 1] = byte

				if (this.buffer.length >= this.opts.lengthOffset + 1) {
					const len = bufferView.getUint8(this.opts.lengthOffset)
					if (this.buffer.length == len + this.opts.packetOverhead || len > this.opts.maxLen) {
						chunks.push(this.buffer)
						this.buffer = new Uint8Array(0)
						this.start = false
					}
				}
			}
		}

		return chunks
	}
}
