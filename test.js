const lib = require('./packages/node')

;(async () => {
	const devs = await lib.listLoupedecks()
	const dev = await lib.openLoupedeck(devs[0].path)

	console.log(dev)

	dev.on('down', (info) => console.log('down', info))
	dev.on('up', (info) => console.log('up', info))
	dev.on('rotate', (info, delta) => console.log('rotate', info, delta))
	dev.on('touchstart', (info) => console.log('touchstart', info))
	dev.on('touchend', (info) => console.log('touchend', info))
	dev.on('touchmove', (info) => console.log('touchmove', info))

	const serial = await dev.getSerialNumber()
	console.log(`serial: ${serial}`)
	const fw = await dev.getFirmwareVersion()
	console.log(`fw: ${fw}`)

	await dev.drawSolidColour(lib.LoupedeckDisplayId.Center, { red: 255, green: 0, blue: 0 }, 360, 270, 0, 0, true)

	for (const c of dev.controls) {
		if (c.type === 'button') {
			await dev.setButtonColor({
				id: c.index,
				red: 255,
				green: 255,
				blue: 255,
			})
		}
	}

	dev.close()
})()
