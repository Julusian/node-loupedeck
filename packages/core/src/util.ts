import { LoupedeckBufferFormat, type RGBColor } from './constants.js'
import type { LoupedeckDisplayDefinition } from './models/interface.js'

export type CanDrawPixelFn = (x: number, y: number) => boolean
export type CanDrawRowFn = (y: number) => boolean

export function createCanDrawPixel(
	drawX: number,
	drawY: number,
	lcdKeySize: number,
	displayInfo: Pick<LoupedeckDisplayDefinition, 'rowGap' | 'columnGap'>
): [CanDrawPixelFn, CanDrawRowFn] {
	const roundY = lcdKeySize + displayInfo.rowGap
	const roundX = lcdKeySize + displayInfo.columnGap

	const canDrawPixel = (x: number, y: number) => {
		if (displayInfo.rowGap > 0 && (drawY + y) % roundY >= lcdKeySize) {
			// Skip blanked rows
			return false
		}

		if (displayInfo.columnGap > 0 && (drawX + x) % roundX >= lcdKeySize) {
			// Skip blanked rows
			return false
		}

		return true
	}
	const canDrawRow = (y: number) => {
		if (displayInfo.rowGap > 0 && (drawY + y) % roundY >= lcdKeySize) {
			// Skip blanked rows
			return false
		}

		return true
	}

	return [canDrawPixel, canDrawRow]
}

export function encodeBuffer(
	input: Uint8Array | Uint8ClampedArray,
	output: Uint8Array,
	format: LoupedeckBufferFormat,
	outputPadding: number,
	width: number,
	height: number,
	canDrawPixel: CanDrawPixelFn,
	canDrawRow: CanDrawRowFn,
	endianness: 'LE' | 'BE' | undefined
): void {
	const pixelCount = width * height
	if (input.length !== pixelCount * format.length)
		throw new Error(`Incorrect buffer length ${input.length} expected ${pixelCount * format.length}`)
	if (output.length !== pixelCount * 2 + outputPadding)
		throw new Error(`Incorrect buffer length ${output.length} expected ${pixelCount * 2 + outputPadding}`)

	const inputView = uint8ArrayToDataView(input)
	const outputView = uint8ArrayToDataView(output)

	switch (format) {
		case LoupedeckBufferFormat.RGB:
			for (let y = 0; y < height; y++) {
				if (!canDrawRow(y)) continue

				for (let x = 0; x < width; x++) {
					if (!canDrawPixel(x, y)) continue

					const i = y * width + x
					const r = inputView.getUint8(i * 3 + 0) >> 3
					const g = inputView.getUint8(i * 3 + 1) >> 2
					const b = inputView.getUint8(i * 3 + 2) >> 3
					outputView.setUint16(outputPadding + i * 2, (r << 11) + (g << 5) + b, endianness !== 'BE')
				}
			}
			break
		default:
			throw new Error(`Unknown BufferFormat: "${format}"`)
	}
}

export function checkRGBValue(value: number): void {
	if (value < 0 || value > 255) {
		throw new TypeError('Expected a valid color RGB value 0 - 255')
	}
}

export function checkRGBColor(color: RGBColor): void {
	checkRGBValue(color.red)
	checkRGBValue(color.green)
	checkRGBValue(color.blue)
}

export function uint8ArrayToDataView(buffer: Uint8Array | Uint8ClampedArray): DataView {
	return new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
}

export function createSerialPacketHeaderPacket(data: Uint8Array): Uint8Array {
	// Large messages
	if (data.length > 0xff) {
		const prep = new Uint8Array(14)

		const prepView = uint8ArrayToDataView(prep)
		prepView.setUint8(0, 0x82)
		prepView.setUint8(1, 0xff)
		prepView.setUint32(6, data.length, false)

		return prep
	}
	// Small messages
	else {
		// Prepend each message with a send indicating the length to come
		const prep = new Uint8Array(6)

		const prepView = uint8ArrayToDataView(prep)
		prepView.setUint8(0, 0x82)
		prepView.setUint8(1, 0x80 + data.length) // TODO - is this correct, or should it switch to large mode sooner?

		return prep
	}
}
