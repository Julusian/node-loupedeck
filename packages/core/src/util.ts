import { LoupedeckBufferFormat, RGBColor } from './constants'

export function encodeBuffer(
	input: Buffer,
	output: Buffer,
	format: LoupedeckBufferFormat,
	outputPadding: number,
	pixelCount: number
): void {
	if (input.length !== pixelCount * format.length)
		throw new Error(`Incorrect buffer length ${input.length} expected ${pixelCount * format.length}`)
	if (output.length !== pixelCount * 2 + outputPadding)
		throw new Error(`Incorrect buffer length ${output.length} expected ${pixelCount * 2 + outputPadding}`)

	switch (format) {
		case LoupedeckBufferFormat.RGB:
			for (let i = 0; i < pixelCount; i++) {
				const r = input.readUInt8(i * 3 + 0) >> 3
				const g = input.readUInt8(i * 3 + 1) >> 2
				const b = input.readUInt8(i * 3 + 2) >> 3
				output.writeUint16LE((r << 11) + (g << 5) + b, outputPadding + i * 2)
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
