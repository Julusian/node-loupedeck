# @loupedeck/node

![Node CI](https://github.com/Julusian/node-loupedeck/workflows/Node%20CI/badge.svg)

[![npm version](https://img.shields.io/npm/v/@loupedeck/node.svg)](https://npm.im/@loupedeck/node)
[![license](https://img.shields.io/npm/l/@loupedeck/node.svg)](https://npm.im/@loupedeck/node)

[@loupedeck](https://www.npmjs.com/org/loupedeck) is a collection of libraries for interfacing with the various models of the [Loupedeck](https://loupedeck.com/uk/).

## Intended use

This library has nothing to do with the official loupedeck software. There is nothing here to install and run. This is a library to help developers make alternatives to that software

## Device Support

-   [x] Loupedeck CT
-   [x] Loupedeck Live (firmware v0.2)
-   [x] Loupedeck Live S
-   [x] Razer Stream controller
-   [x] Razer Stream controller X

## Install

`$ npm install --save @loupedeck/node`

### Native dependencies

All of this library's native dependencies ship with prebuilt binaries, so having a full compiler toolchain should not be necessary to install `@loupedeck/node`.

## API

The root methods exposed by the library are as follows. For more information it is recommended to rely on the typescript typings for hints or to browse through the source to see what methods are available

```typescript
/**
 * Scan for and list detected devices
 */
export function listLoupedecks(): Promise<LoupedeckDeviceInfo[]>

/**
 * Open a loupedeck
 * @param path The path of the device to open
 * @param options Options to customise the device behvaiour
 */
export async function openLoupedeck(path: string, options?: LoupedeckDeviceOptions): Promise<LoupedeckDevice>
```

The Loupedeck type can be found [here](/packages/node/src/models/interface.ts#L6)

## Example

```typescript
import { listLoupedecks, openLoupedeck } from '@loupedeck/node'

const loupedecks = await listLoupedecks()
const myLoupedeck = await openStreamDeck(loupedecks[0].path)

myLoupedeck.on('down', (info) => {
	console.log('control down', info)
})

myLoupedeck.on('up', (info) => {
	console.log('control up', info)
})

myLoupedeck.on('rotate', (info, delta) => {
	console.log('control rotate', info, delta)
})

// Fired whenever an error is detected by the device.
// Always add a listener for this event! If you don't, your application may crash if an error is reported.
myLoupedeck.on('error', (error) => {
	console.error(error)
})

// Fill the first button form the left in the first row with a solid red color. This is asynchronous.
const red = { red: 255, green: 0, blue: 0 }
await myLoupedeck.drawSolidColour('center', red, 90, 90, 0, 0)
console.log('Successfully wrote a red square to the center display.')
```

Some more complex demos can be found in the [examples](examples/) folder.

## Contributing

The @loupedeck team enthusiastically welcomes contributions and project participation! There's a bunch of things you can do if you want to contribute! Please don't hesitate to jump in if you'd like to, or even ask us questions if something isn't clear.

Please refer to the [Changelog](CHANGELOG.md) for project history details, too.
