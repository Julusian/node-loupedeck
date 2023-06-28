import { LoupedeckBufferFormat, RGBColor } from './constants'
import { LoupedeckDisplayDefinition } from './models/interface'

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
	input: Buffer,
	output: Buffer,
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

	switch (format) {
		case LoupedeckBufferFormat.RGB:
			for (let y = 0; y < height; y++) {
				if (!canDrawRow(y)) continue

				for (let x = 0; x < width; x++) {
					if (!canDrawPixel(x, y)) continue

					const i = y * width + x
					const r = input.readUInt8(i * 3 + 0) >> 3
					const g = input.readUInt8(i * 3 + 1) >> 2
					const b = input.readUInt8(i * 3 + 2) >> 3
					if (endianness === 'BE') {
						output.writeUint16BE((r << 11) + (g << 5) + b, outputPadding + i * 2)
					} else {
						output.writeUint16LE((r << 11) + (g << 5) + b, outputPadding + i * 2)
					}
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
