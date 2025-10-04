import type { LoupedeckDisplayId } from './constants.js'

export interface LoupedeckControlDefinitionBase {
	type: 'button' | 'encoder' | 'wheel' | 'lcd-segment'

	row: number
	column: number
}

export interface LoupedeckButtonControlLcdPosition {
	display: LoupedeckDisplayId
	x: number
	y: number
	size: number
}

export interface LoupedeckButtonControlDefinition extends LoupedeckControlDefinitionBase {
	type: 'button'

	id: string
	encodedIndex: number

	feedbackType: 'lcd' | 'rgb'

	/**
	 * The LCD position of this button, if it has one
	 * This must be set if the button is of feedbackType 'lcd'
	 */
	lcdPosition?: LoupedeckButtonControlLcdPosition
}

export interface LoupedeckEncoderControlDefinition extends LoupedeckControlDefinitionBase {
	type: 'encoder'

	id: string
	encodedIndex: number
}

export interface LoupedeckWheelControlDefinition extends LoupedeckControlDefinitionBase {
	type: 'wheel'

	id: 'wheel'

	rowSpan: number
	columnSpan: number
}

export interface LoupedeckLcdSegmentControlDefinition extends LoupedeckControlDefinitionBase {
	type: 'lcd-segment'

	id: 'left' | 'right'

	rowSpan: number
	columnSpan: number
}

export type LoupedeckControlDefinition =
	| LoupedeckButtonControlDefinition
	| LoupedeckEncoderControlDefinition
	| LoupedeckWheelControlDefinition
	| LoupedeckLcdSegmentControlDefinition
