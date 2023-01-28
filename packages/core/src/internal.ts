export { DEVICE_MODELS } from './models/list'

export const WS_UPGRADE_HEADER = Buffer.from(`GET /index.html
HTTP/1.1
Connection: Upgrade
Upgrade: websocket
Sec-WebSocket-Key: 123abc

`)
export const WS_UPGRADE_RESPONSE = 'HTTP/1.1'
