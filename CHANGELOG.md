# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.2.0](https://github.com/Julusian/node-loupedeck/compare/v1.1.2...v1.2.0) (2024-09-09)


### Features

* update serialport library ([3ec3d18](https://github.com/Julusian/node-loupedeck/commit/3ec3d18cf55993e6fddb95859201ac6bb5d5c1d5))





## [2.0.0](https://github.com/Julusian/node-loupedeck/compare/v1.2.0...v2.0.0) (2025-09-27)


### ⚠ BREAKING CHANGES

* rework control definitions to expose rows and columns
* remove need for buffer polyfill
* convert to esm
* require node 20

### Features

* convert to esm ([01fb652](https://github.com/Julusian/node-loupedeck/commit/01fb65204bbd9577ef0709a75ea9f155211cc028))
* remove need for buffer polyfill ([d2eb409](https://github.com/Julusian/node-loupedeck/commit/d2eb4094dbb0184b318697834cccd0f5dea3d5a7))
* require node 20 ([cb0ce9a](https://github.com/Julusian/node-loupedeck/commit/cb0ce9a1289dbb9fbd19673b72c51fb2ec927cfb))
* rework control definitions to expose rows and columns ([ebb9582](https://github.com/Julusian/node-loupedeck/commit/ebb958232e8d5657745a2b5e18bd53eb2065ced5))


### Bug Fixes

* incorrect button coordinates handling ([fbe8e24](https://github.com/Julusian/node-loupedeck/commit/fbe8e24aed5206397227a62a9a328dfc55848da4))

## [1.1.2](https://github.com/Julusian/node-loupedeck/compare/v1.1.1...v1.1.2) (2024-05-02)


### Bug Fixes

* send framebuffer flushes for ct v1 ([b46f0d0](https://github.com/Julusian/node-loupedeck/commit/b46f0d09d471a6d8cb11666d6a51c5970490aca5))





## [1.1.1](https://github.com/Julusian/node-loupedeck/compare/v1.1.0...v1.1.1) (2024-02-21)


### Bug Fixes

* duplicate models using same id (ct) ([f4acc90](https://github.com/Julusian/node-loupedeck/commit/f4acc90c6fd27a9f31fc90f86c9b8c7bc51e810a))





# [1.1.0](https://github.com/Julusian/node-loupedeck/compare/v1.0.0...v1.1.0) (2024-02-21)


### Bug Fixes

* typo ([7826274](https://github.com/Julusian/node-loupedeck/commit/78262742f21636dc2d20da6be52d59337b256a73))


### Features

* add support for old loupedeck ct (untested) ([0880237](https://github.com/Julusian/node-loupedeck/commit/0880237853aa601c5e607369b0c70e82ffc7a83a))





# [1.0.0](https://github.com/Julusian/node-loupedeck/compare/v0.4.0...v1.0.0) (2023-07-01)


### Features

* add support for Loupedeck CT ([#3](https://github.com/Julusian/node-loupedeck/issues/3)) ([128da8a](https://github.com/Julusian/node-loupedeck/commit/128da8a40c675d8b964bd6d334cf2ac3dc98164d))





# [0.5.0](https://github.com/Julusian/node-loupedeck/compare/v0.4.0...v0.5.0) (2023-07-01)


### Features

* add support for Loupedeck CT ([#3](https://github.com/Julusian/node-loupedeck/issues/3)) ([128da8a](https://github.com/Julusian/node-loupedeck/commit/128da8a40c675d8b964bd6d334cf2ac3dc98164d))





# [0.4.0](https://github.com/Julusian/node-loupedeck/compare/v0.3.1...v0.4.0) (2023-04-18)


### Bug Fixes

* avoid drawing lcd dead zones ([a133410](https://github.com/Julusian/node-loupedeck/commit/a13341005bf3273307abab4c81c6794186f20e8e))
* refactoring of display handling ([cf6d2eb](https://github.com/Julusian/node-loupedeck/commit/cf6d2eb70c1fa7ec16dc86dd6a635d85178e5e33))
* web demos ([6c269c7](https://github.com/Julusian/node-loupedeck/commit/6c269c754d1a7e58862e5678d2d78b95ad0d078f))


### Features

* razer stream controller x ([2b777ba](https://github.com/Julusian/node-loupedeck/commit/2b777ba02cf618173ba3c0dc2c1d1f5b3158ab6f))
* webserial prototype ([3f2959f](https://github.com/Julusian/node-loupedeck/commit/3f2959fd6c33575cf6b6dbb098366cce9c932597))





## [0.3.1](https://github.com/Julusian/node-loupedeck/compare/v0.3.0...v0.3.1) (2022-12-02)

### Reverts

- Revert "fix: don't wait for acks on display drawing" ([98b2cbc](https://github.com/Julusian/node-loupedeck/commit/98b2cbc171d0e0a4a78d693ee51686c372409d5e))

# [0.3.0](https://github.com/Julusian/node-loupedeck/compare/v0.2.2...v0.3.0) (2022-12-01)

### Bug Fixes

- don't wait for acks on display drawing ([f1d2a38](https://github.com/Julusian/node-loupedeck/commit/f1d2a38133b2f27c519d22cf2f6e540b15982746))
- support for live (v2.00) ([3ed86eb](https://github.com/Julusian/node-loupedeck/commit/3ed86ebb3ce66a8ae466b2211763667588e1f59f))

## [0.2.3](https://github.com/Julusian/node-loupedeck/compare/v0.2.2...v0.2.3) (2022-11-29)

### Bug Fixes

- don't wait for acks on display drawing ([f1d2a38](https://github.com/Julusian/node-loupedeck/commit/f1d2a38133b2f27c519d22cf2f6e540b15982746))

## [0.2.2](https://github.com/Julusian/node-loupedeck/compare/v0.2.1...v0.2.2) (2022-11-17)

### Bug Fixes

- live-s button index ([39f8771](https://github.com/Julusian/node-loupedeck/commit/39f8771509bc40493597c31178dd54a453b1bf91))
- live-s display offset ([9952289](https://github.com/Julusian/node-loupedeck/commit/9952289c522547eae4658e00a789247194b59f21))

## [0.2.1](https://github.com/Julusian/node-loupedeck/compare/v0.2.0...v0.2.1) (2022-10-10)

### Bug Fixes

- getSerialNumber ([7bb2b41](https://github.com/Julusian/node-loupedeck/commit/7bb2b411193743ae78f0006112d71827f3c9d752))

# [0.2.0](https://github.com/Julusian/node-loupedeck/compare/v0.1.1...v0.2.0) (2022-10-10)

### Bug Fixes

- cleanup pendingTransactions as they are received ([cb20a4e](https://github.com/Julusian/node-loupedeck/commit/cb20a4e987021bebff0e0aa403633f98f219911f))

### Features

- `drawKeyBuffer` method ([e53f53f](https://github.com/Julusian/node-loupedeck/commit/e53f53fb9f606a7545a45ac3119a6f2bec37afb3))
- prototype loupedeck live-s support ([f370e6e](https://github.com/Julusian/node-loupedeck/commit/f370e6ed8799cb8d77fef9df618ff48bde404abf))
- prototype razer stream controller implementation ([20950fc](https://github.com/Julusian/node-loupedeck/commit/20950fcd20f3020c32bb90a3e9a7189e82da1f40))

## [0.1.1](https://github.com/Julusian/node-loupedeck/compare/v0.1.0...v0.1.1) (2022-10-09)

### Bug Fixes

- reduce errors on close ([3654a65](https://github.com/Julusian/node-loupedeck/commit/3654a651e5d5758edb4a19b804addf4ea86177ea))
- waitForAck mode ([cba2b99](https://github.com/Julusian/node-loupedeck/commit/cba2b99b71e1c19b6d196f86072ddd8757e96793))

# 0.1.0 (2022-10-09)

### Features

- initial implementation ecc72f8
