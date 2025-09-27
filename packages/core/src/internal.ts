export { DEVICE_MODELS } from './models/list.js'
export { uint8ArrayToDataView, createSerialPacketHeaderPacket } from './util.js'

export const WS_UPGRADE_HEADER: Uint8Array = new TextEncoder().encode(`GET /index.html
HTTP/1.1
Connection: Upgrade
Upgrade: websocket
Sec-WebSocket-Key: 123abc

`)
export const WS_UPGRADE_RESPONSE = 'HTTP/1.1'
