import assert from 'node:assert/strict'
import test from 'node:test'
import { LoupedeckDisplayId, LoupedeckSerialConnection, LoupedeckVibratePattern } from '../dist/index.js'
import { LoupedeckLiveSDevice } from '../dist/models/live-s.js'
import { LoupedeckNodeSerialConnection } from '../../node/dist/serial.js'

class FakeSerialConnection extends LoupedeckSerialConnection {
	sent = []
	sendError = undefined
	onSend = undefined
	closeImpl = undefined
	ready = true

	isReady() {
		return this.ready
	}

	async close() {
		if (this.closeImpl) {
			await this.closeImpl()
		} else {
			this.ready = false
			this.emit('disconnect')
		}
	}

	async send(packet) {
		const copy = new Uint8Array(packet)
		this.sent.push(copy)

		if (this.sendError) {
			const error = this.sendError
			this.sendError = undefined
			throw error
		}

		await this.onSend?.(copy)
	}

	ack(transactionId) {
		this.emit('message', new Uint8Array([0, 0, 3, 0, transactionId]))
	}
}

function createDevice(connection = new FakeSerialConnection()) {
	return { connection, device: new LoupedeckLiveSDevice(connection, {}) }
}

async function packetAt(connection, index) {
	for (let attempt = 0; attempt < 100; attempt++) {
		if (connection.sent[index]) return connection.sent[index]
		await new Promise((resolve) => setImmediate(resolve))
	}

	throw new Error(`Timed out waiting for packet ${index}`)
}

async function acknowledge(connection, packet) {
	// Model an acknowledgement delivered after a normal asynchronous submission.
	await new Promise((resolve) => setImmediate(resolve))
	connection.ack(packet[2])
}

test('default vibrate continues to wait for its acknowledgement', async () => {
	const { connection, device } = createDevice()
	const vibration = device.vibrate(LoupedeckVibratePattern.SHORT)
	const packet = await packetAt(connection, 0)

	let settled = false
	void vibration.then(() => {
		settled = true
	})
	await Promise.resolve()
	assert.equal(settled, false)

	await acknowledge(connection, packet)
	await vibration
})

test('normal commands consume acknowledgements received during submission', async () => {
	const connection = new FakeSerialConnection()
	connection.onSend = (packet) => connection.ack(packet[2])
	const { device } = createDevice(connection)

	await device.vibrate(LoupedeckVibratePattern.SHORT)
	await device.setBrightness(0.5)

	expectPacketCommands(connection.sent, [0x1b, 0x09])
})

test('a write failure after an acknowledgement removes the normal waiter', async () => {
	const connection = new FakeSerialConnection()
	connection.onSend = (packet) => {
		connection.ack(packet[2])
		throw new Error('write failed after acknowledgement')
	}
	const { device } = createDevice(connection)

	await assert.rejects(device.setBrightness(0.5), /write failed after acknowledgement/)

	connection.onSend = undefined
	const brightness = device.setBrightness(0.5)
	const packet = await packetAt(connection, 1)
	await acknowledge(connection, packet)
	await brightness
})

test('best-effort vibrate consumes an acknowledgement received during submission', async () => {
	const connection = new FakeSerialConnection()
	connection.onSend = (packet) => connection.ack(packet[2])
	const { device } = createDevice(connection)

	await device.vibrate(LoupedeckVibratePattern.SHORT, { bestEffort: true })
	await device.vibrate(LoupedeckVibratePattern.SHORT, { bestEffort: true })

	assert.equal(connection.sent.length, 2)
	assert.notEqual(connection.sent[0][2], connection.sent[1][2])
	assert.equal(device.suppressedBestEffortVibrations, 0)
})

test('a missing best-effort acknowledgement suppresses haptics but not brightness', async () => {
	const { connection, device } = createDevice()
	await device.vibrate(LoupedeckVibratePattern.SHORT, { bestEffort: true })
	const vibrationId = connection.sent[0][2]

	await device.vibrate(LoupedeckVibratePattern.SHORT, { bestEffort: true })
	assert.equal(connection.sent.length, 1)
	assert.equal(device.suppressedBestEffortVibrations, 1)

	const brightness = device.setBrightness(0.5)
	const packet = await packetAt(connection, 1)
	assert.notEqual(packet[2], vibrationId)
	await acknowledge(connection, packet)
	await brightness

	const draw = device.drawSolidColour(LoupedeckDisplayId.Center, { red: 1, green: 2, blue: 3 }, 1, 1, 0, 0)
	const drawPacket = await packetAt(connection, 2)
	assert.notEqual(drawPacket[2], vibrationId)
	await acknowledge(connection, drawPacket)
	await draw

	const blank = device.blankDevice(false, true)
	const blankPacket = await packetAt(connection, 3)
	assert.notEqual(blankPacket[2], vibrationId)
	await acknowledge(connection, blankPacket)
	await blank
})

test('a late haptic acknowledgement cannot resolve normal commands after ID wrap', async () => {
	const { connection, device } = createDevice()
	await device.vibrate(LoupedeckVibratePattern.SHORT, { bestEffort: true })
	const vibrationId = connection.sent[0][2]

	for (let index = 0; index < 600; index++) {
		const brightness = device.setBrightness(index % 10)
		const packet = await packetAt(connection, index + 1)
		assert.notEqual(packet[2], vibrationId)
		await acknowledge(connection, packet)
		await brightness
	}

	connection.ack(vibrationId)
	await device.vibrate(LoupedeckVibratePattern.SHORT, { bestEffort: true })
	assert.equal(connection.sent.length, 602)
})

test('an uncertain haptic write failure keeps the reserved ID until close', async () => {
	const { connection, device } = createDevice()
	connection.sendError = new Error('write failed')

	await assert.rejects(device.vibrate(LoupedeckVibratePattern.SHORT, { bestEffort: true }), /write failed/)
	const vibrationId = connection.sent[0][2]

	await device.vibrate(LoupedeckVibratePattern.SHORT, { bestEffort: true })
	assert.equal(connection.sent.length, 1)
	assert.equal(device.suppressedBestEffortVibrations, 1)

	const brightness = device.setBrightness(0.5)
	const packet = await packetAt(connection, 1)
	assert.notEqual(packet[2], vibrationId)
	await acknowledge(connection, packet)
	await brightness

	connection.ack(vibrationId)
	await device.vibrate(LoupedeckVibratePattern.SHORT, { bestEffort: true })
	assert.equal(connection.sent.length, 3)

	await device.close()
	await device.vibrate(LoupedeckVibratePattern.SHORT, { bestEffort: true })
	assert.equal(connection.sent.length, 3)
})

const PULSE = {
	bestEffort: true,
	interrupt: { afterMs: 5, pattern: LoupedeckVibratePattern.SHARP_CLICK_LOW },
}

test('an interrupted pulse submits both patterns before a command queued behind it', async () => {
	const connection = new FakeSerialConnection()
	const sentAt = []
	connection.onSend = () => {
		sentAt.push(performance.now())
	}
	const { device } = createDevice(connection)

	const pulse = device.vibrate(LoupedeckVibratePattern.SHARP_CLICK_MEDIUM, {
		bestEffort: true,
		interrupt: { afterMs: 20, pattern: LoupedeckVibratePattern.SHARP_CLICK_LOW },
	})
	const brightness = device.setBrightness(0.5)
	await pulse

	const brightnessPacket = await packetAt(connection, 2)
	expectPacketCommands(connection.sent, [0x1b, 0x1b, 0x09])
	assert.equal(connection.sent[0][3], LoupedeckVibratePattern.SHARP_CLICK_MEDIUM)
	assert.equal(connection.sent[1][3], LoupedeckVibratePattern.SHARP_CLICK_LOW)
	assert.equal(new Set(connection.sent.map((packet) => packet[2])).size, 3)
	// A wide margin: timers may fire slightly early, and the queue slot rather than the clock bounds the spacing
	assert.ok(sentAt[1] - sentAt[0] >= 10, `interrupt followed after ${sentAt[1] - sentAt[0]}ms`)

	await acknowledge(connection, brightnessPacket)
	await brightness
})

test('an interrupted pulse stays reserved until both acknowledgements arrive', async () => {
	const { connection, device } = createDevice()
	await device.vibrate(LoupedeckVibratePattern.SHARP_CLICK_MEDIUM, PULSE)
	assert.equal(connection.sent.length, 2)

	connection.ack(connection.sent[0][2])
	await device.vibrate(LoupedeckVibratePattern.SHARP_CLICK_MEDIUM, PULSE)
	assert.equal(connection.sent.length, 2)
	assert.equal(device.suppressedBestEffortVibrations, 1)

	connection.ack(connection.sent[1][2])
	await device.vibrate(LoupedeckVibratePattern.SHARP_CLICK_MEDIUM, PULSE)
	assert.equal(connection.sent.length, 4)
	assert.equal(device.suppressedBestEffortVibrations, 1)
})

test('close during the interrupt delay does not submit the interrupt', async () => {
	const { connection, device } = createDevice()
	const pulse = device.vibrate(LoupedeckVibratePattern.SHARP_CLICK_MEDIUM, {
		bestEffort: true,
		interrupt: { afterMs: 20, pattern: LoupedeckVibratePattern.SHARP_CLICK_LOW },
	})
	await packetAt(connection, 0)

	await device.close()
	await pulse
	expectPacketCommands(connection.sent, [0x1b])
})

test('disconnect during the interrupt delay does not submit the interrupt', async () => {
	const { connection, device } = createDevice()
	device.on('error', () => null)
	const pulse = device.vibrate(LoupedeckVibratePattern.SHARP_CLICK_MEDIUM, {
		bestEffort: true,
		interrupt: { afterMs: 20, pattern: LoupedeckVibratePattern.SHARP_CLICK_LOW },
	})
	await packetAt(connection, 0)

	connection.emit('disconnect')
	await pulse
	expectPacketCommands(connection.sent, [0x1b])
})

test('a failed pattern write releases the unsent interrupt ID but keeps the uncertain one', async () => {
	const { connection, device } = createDevice()
	connection.sendError = new Error('uncertain write')
	await assert.rejects(device.vibrate(LoupedeckVibratePattern.SHARP_CLICK_MEDIUM, PULSE), /uncertain write/)
	expectPacketCommands(connection.sent, [0x1b])

	await device.vibrate(LoupedeckVibratePattern.SHARP_CLICK_MEDIUM, PULSE)
	assert.equal(device.suppressedBestEffortVibrations, 1)

	// The write was delivered after all: its late acknowledgement alone must release haptics
	connection.ack(connection.sent[0][2])
	await device.vibrate(LoupedeckVibratePattern.SHARP_CLICK_MEDIUM, PULSE)
	assert.equal(connection.sent.length, 3)
})

test('a failed interrupt write keeps the reservation', async () => {
	const connection = new FakeSerialConnection()
	connection.onSend = () => {
		if (connection.sent.length === 2) throw new Error('interrupt write failed')
	}
	const { device } = createDevice(connection)

	await assert.rejects(device.vibrate(LoupedeckVibratePattern.SHARP_CLICK_MEDIUM, PULSE), /interrupt write failed/)
	connection.ack(connection.sent[0][2])
	await device.vibrate(LoupedeckVibratePattern.SHARP_CLICK_MEDIUM, PULSE)
	assert.equal(connection.sent.length, 2)
	assert.equal(device.suppressedBestEffortVibrations, 1)
})

test('an interrupt is rejected without bestEffort or with an out-of-range delay', async () => {
	const { connection, device } = createDevice()
	const interrupt = { afterMs: 5, pattern: LoupedeckVibratePattern.SHARP_CLICK_LOW }

	await assert.rejects(
		device.vibrate(LoupedeckVibratePattern.SHARP_CLICK_MEDIUM, { interrupt }),
		/requires bestEffort/
	)
	for (const afterMs of [0, 251, Number.NaN]) {
		await assert.rejects(
			device.vibrate(LoupedeckVibratePattern.SHARP_CLICK_MEDIUM, {
				bestEffort: true,
				interrupt: { ...interrupt, afterMs },
			}),
			RangeError
		)
	}
	await assert.rejects(
		device.vibrate(LoupedeckVibratePattern.SHARP_CLICK_MEDIUM, {
			bestEffort: true,
			interrupt: { afterMs: 5, pattern: 0 },
		}),
		/Invalid vibrate interrupt pattern/
	)
	assert.equal(connection.sent.length, 0)
	assert.equal(device.suppressedBestEffortVibrations, 0)
})

test('normal commands contain waiter rejection while transport submission is pending', async () => {
	const { connection, device } = createDevice()
	let resolveSend
	connection.onSend = () =>
		new Promise((resolve) => {
			resolveSend = resolve
		})

	const brightness = device.setBrightness(0.5)
	await packetAt(connection, 0)
	connection.emit('disconnect')
	await new Promise((resolve) => setTimeout(resolve, 2))
	resolveSend()
	await assert.rejects(brightness, /Connection closed/)
})

test('close contains a normal waiter rejection while transport submission is pending', async () => {
	const { connection, device } = createDevice()
	let resolveSend
	let resolveClose
	connection.onSend = () =>
		new Promise((resolve) => {
			resolveSend = resolve
		})
	connection.closeImpl = () =>
		new Promise((resolve) => {
			resolveClose = resolve
		})

	const brightness = device.setBrightness(0.5)
	await packetAt(connection, 0)
	const closing = device.close()
	await new Promise((resolve) => setTimeout(resolve, 2))
	resolveSend()
	await assert.rejects(brightness, /Connection closed/)

	resolveClose()
	await closing
})

test('a failed close does not replay a haptic queued behind a normal command', async () => {
	const { connection, device } = createDevice()
	connection.closeImpl = async () => {
		throw new Error('close failed')
	}

	const brightness = device.setBrightness(0.5)
	await packetAt(connection, 0)
	const vibration = device.vibrate(LoupedeckVibratePattern.SHORT, { bestEffort: true })
	await assert.rejects(device.close(), /close failed/)

	await assert.rejects(brightness, /Connection closed/)
	await new Promise((resolve) => setImmediate(resolve))
	await vibration
	assert.equal(connection.sent.length, 1)

	await device.vibrate(LoupedeckVibratePattern.SHORT, { bestEffort: true })
	assert.equal(connection.sent.length, 1)
})

test('close does not submit a haptic queued behind a normal command', async () => {
	const { connection, device } = createDevice()
	let resolveClose
	connection.closeImpl = () =>
		new Promise((resolve) => {
			resolveClose = resolve
		})

	const brightness = device.setBrightness(0.5)
	await packetAt(connection, 0)
	const vibration = device.vibrate(LoupedeckVibratePattern.SHORT, { bestEffort: true })
	const closing = device.close()

	await assert.rejects(brightness, /Connection closed/)
	await new Promise((resolve) => setImmediate(resolve))
	assert.equal(connection.sent.length, 1)

	resolveClose()
	await closing
	await vibration
})

test('skipWaitForAcks reserves all outstanding transaction IDs and the haptic ID', async () => {
	const connection = new FakeSerialConnection()
	const device = new LoupedeckLiveSDevice(connection, { skipWaitForAcks: true })
	await device.vibrate(LoupedeckVibratePattern.SHORT, { bestEffort: true })
	const vibrationId = connection.sent[0][2]

	const requests = Array.from({ length: 254 }, () => device.getSerialNumber())
	await new Promise((resolve) => setImmediate(resolve))
	assert.equal(connection.sent.length, 255)
	assert.equal(new Set(connection.sent.map((packet) => packet[2])).size, 255)
	assert.equal(
		connection.sent.some((packet, index) => index > 0 && packet[2] === vibrationId),
		false
	)

	await assert.rejects(device.getSerialNumber(), /No transaction ID available/)
	assert.equal(connection.sent.length, 255)

	const freedId = connection.sent[1][2]
	connection.ack(freedId)
	await requests[0]
	const replacement = device.getSerialNumber()
	const replacementPacket = await packetAt(connection, 255)
	assert.equal(replacementPacket[2], freedId)
	connection.ack(freedId)
	await replacement

	for (const packet of connection.sent.slice(2, 255)) connection.ack(packet[2])
	await Promise.all(requests.slice(1))
	connection.ack(vibrationId)
})

test('node serial send waits for each write callback and surfaces its error', async () => {
	const callbacks = []
	const writes = []
	const serialConnection = {
		isOpen: true,
		write(packet, callback) {
			writes.push(new Uint8Array(packet))
			callbacks.push(callback)
		},
		on() {
			return this
		},
		pipe() {
			return this
		},
	}
	const transport = new LoupedeckNodeSerialConnection(serialConnection)

	let settled = false
	const submission = transport.send(new Uint8Array([4, 0x1b, 1, LoupedeckVibratePattern.SHORT]))
	void submission.then(() => {
		settled = true
	})

	await Promise.resolve()
	assert.equal(writes.length, 2)
	assert.equal(settled, false)
	callbacks.shift()(undefined)
	assert.equal(settled, false)
	callbacks.shift()(undefined)
	await submission

	transport.connection = {
		isOpen: true,
		write(_packet, callback) {
			callbacks.push(callback)
		},
	}
	const payloadFailure = transport.send(new Uint8Array([4, 0x1b, 2, LoupedeckVibratePattern.SHORT]))
	await Promise.resolve()
	callbacks.shift()(undefined)
	callbacks.shift()(new Error('payload write failed'))
	await assert.rejects(payloadFailure, /payload write failed/)

	transport.connection = {
		isOpen: true,
		write(_packet, callback) {
			callbacks.push(callback)
		},
	}
	const failedSubmission = transport.send(new Uint8Array([4, 0x1b, 3, LoupedeckVibratePattern.SHORT]))
	await Promise.resolve()
	callbacks.shift()(new Error('header write failed'))
	callbacks.shift()(undefined)
	await assert.rejects(failedSubmission, /header write failed/)
})

test('skipWaitForAcks submits each node frame without header-payload interleaving', async () => {
	const callbacks = []
	const writes = []
	const serialConnection = {
		isOpen: true,
		write(packet, callback) {
			writes.push(new Uint8Array(packet))
			callbacks.push(callback)
		},
		on() {
			return this
		},
		pipe() {
			return this
		},
	}
	const transport = new LoupedeckNodeSerialConnection(serialConnection)
	const device = new LoupedeckLiveSDevice(transport, { skipWaitForAcks: true })

	const first = device.setBrightness(0.1)
	const second = device.setBrightness(0.2)

	assert.equal(writes.length, 4)
	assert.deepEqual(writes[1], new Uint8Array([4, 0x09, 1, 1]))
	assert.deepEqual(writes[3], new Uint8Array([4, 0x09, 2, 2]))

	for (const callback of callbacks) callback(undefined)
	await Promise.all([first, second])
})

function expectPacketCommands(packets, commands) {
	assert.deepEqual(
		packets.map((packet) => packet[1]),
		commands
	)
}
