import { LoupedeckDisplayId } from './constants.js'
import type { LoupedeckControlDefinition } from './controlDefinition.js'
import type { ModelSpec } from './models/base.js'

export function freezeDefinitions(controls: LoupedeckControlDefinition[]): Readonly<LoupedeckControlDefinition[]> {
	return Object.freeze(controls.map((control) => Object.freeze(control)))
}

export function generateButtonsRow(encodedIndex: number): LoupedeckControlDefinition[] {
	const controls: LoupedeckControlDefinition[] = []

	for (let i = 0; i < 8; i++) {
		controls.push({
			id: `button-${i + 1}`,
			type: 'button',
			row: 3,
			column: i,
			encodedIndex: encodedIndex + i,
			feedbackType: 'rgb',
		})
	}

	return controls
}
export function generateEncoderColumn(encodedIndex: number, column: number): LoupedeckControlDefinition[] {
	const controls: LoupedeckControlDefinition[] = []

	for (let i = 0; i < 3; i++) {
		controls.push({
			id: `encoder-${i}-${column}`,
			type: 'encoder',
			row: i,
			column,
			encodedIndex: encodedIndex + i,
		})
	}

	return controls
}

export function generateTopScreenEncoders(encodedIndex: number): LoupedeckControlDefinition[] {
	return [
		//
		...generateEncoderColumn(encodedIndex, 0),
		...generateEncoderColumn(encodedIndex + 3, 7),
	]
}

export function generateTopScreenLcdStrips(x1: number, x2: number): LoupedeckControlDefinition[] {
	return [
		{
			id: `left`,
			type: 'lcd-segment',
			row: 0,
			column: x1,
			rowSpan: 3,
			columnSpan: 1,
		},
		{
			id: `right`,
			type: 'lcd-segment',
			row: 0,
			column: x2,
			rowSpan: 3,
			columnSpan: 1,
		},
	]
}

interface ButtonGridOptions {
	rows: number
	columns: number

	colOffset: number

	startEncodedIndex: number | null
}

export function generateButtonGrid(model: ModelSpec, options: ButtonGridOptions): LoupedeckControlDefinition[] {
	const controls: LoupedeckControlDefinition[] = []

	for (let y = 0; y < options.rows; y++) {
		for (let x = 0; x < options.columns; x++) {
			const index = y * options.columns + x
			const row = y
			const column = x + options.colOffset

			controls.push({
				id: `button-${row}-${column}`,
				type: 'button',
				row,
				column,
				encodedIndex: options.startEncodedIndex !== null ? options.startEncodedIndex + index : 0,
				feedbackType: 'lcd',
				lcdPosition: {
					display: LoupedeckDisplayId.Center,
					size: model.lcdKeySize,
					x: x * (model.lcdKeySize + model.displayMain.columnGap),
					y: y * (model.lcdKeySize + model.displayMain.rowGap),
				},
			})
		}
	}

	return controls
}
