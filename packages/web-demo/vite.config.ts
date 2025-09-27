import { defineConfig } from 'vite'
import path from 'path'

// Alias the version string so it can be used in the app
process.env.VITE_LIB_VERSION = process.env.npm_package_version

export default defineConfig({
	publicDir: 'public',
	base: './',
	build: {
		outDir: 'dist',
		chunkSizeWarningLimit: 1 * 1000 * 1000, // Disable warning about large chunks
	},
	plugins: [],
	resolve: {
		alias: {
			'~': path.resolve(__dirname, './src'),
		},
	},
})
