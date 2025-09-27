export interface LoupedeckControlDefinitionBase {
	type: 'button' | 'encoder' | 'wheel'

	row: number
	column: number
}

export interface LoupedeckButtonControlDefinition extends LoupedeckControlDefinitionBase {
	type: 'button'

	id: string
	encodedIndex: number

	feedbackType: 'lcd' | 'rgb'

	/**
	 * Whether this button provides touch events instead of simple up/down
	 */
	isTouch: boolean
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

export type LoupedeckControlDefinition =
	| LoupedeckButtonControlDefinition
	| LoupedeckEncoderControlDefinition
	| LoupedeckWheelControlDefinition
