# @loupedeck

![Node CI](https://github.com/Julusian/node-loupedeck/workflows/Node%20CI/badge.svg)

[@loupedeck](https://www.npmjs.com/org/loupedeck) is a collection of libraries for interfacing with the various models of the [Loupedeck](https://loupedeck.com/uk/).

## Device Support

-   [x] Loupedeck CT
-   [x] Loupedeck Live (firmware v0.2)
-   [x] Loupedeck Live S
-   [x] Razer Stream controller
-   [x] Razer Stream controller X

## Intended use

This library has nothing to do with the official Loupedeck software. There is nothing here to install and run. This is a library to help developers make alternatives to that software

## Installing & Usage

Check one of the installable packages for installation and usage instructions:

-   [`@loupedeck/node`](https://npm.im/@loupedeck/node)
-   [`@loupedeck/web`](https://npm.im/@loupedeck/web)

### Have another target you wish to use?

It is intended that this library will be split into a platform agnostic 'core' layer, and a nodejs specific layer. This will allow for using WebSerial or other serial backends. Let me know if you are interested in utilising this, as a reminder to get it done!

## References

This is largly based on the prior works:

-   https://github.com/foxxyz/loupedeck
-   https://github.com/CommandPost/CommandPost/blob/develop/src/extensions/hs/loupedeck/init.lua
-   https://github.com/bitfocus/loupedeck-ct

## Contributing

The @loupedeck team enthusiastically welcomes contributions and project participation! There's a bunch of things you can do if you want to contribute! Please don't hesitate to jump in if you'd like to, or even ask us questions if something isn't clear.

Please refer to the [Changelog](CHANGELOG.md) for project history details, too.
