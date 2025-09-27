import { generateEslintConfig } from '@sofie-automation/code-standard-preset/eslint/main.mjs'

const baseConfig = await generateEslintConfig({
	enableTypescript: true,
	// ignores: ['packages/web-demo/**/*', 'packages/web/**/*'],
})

const customConfig = [
	...baseConfig,

	{
		files: ['**/*.ts', '**/*.tsx'],
		rules: {
			'@typescript-eslint/consistent-type-imports': 'error',
		},
	},

	{
		files: ['**/examples/*.js', '**/*.cjs'],
		rules: {
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
	{
		files: ['**/__tests__/**/*', '**/examples/**/*'],
		rules: {
			'n/no-extraneous-require': 'off',
			'n/no-extraneous-import': 'off',
		},
	},
	{
		files: ['packages/web/**/*'],
		rules: {
			'n/no-unsupported-features/node-builtins': 'off',
		},
	},
	// {
	// 	files: ['packages/web-demo/src/**/*'],
	// 	rules: {
	// 		'@typescript-eslint/no-require-imports': 'off',
	// 		'n/no-missing-import': 'off',
	// 	},
	// },
]

export default customConfig
