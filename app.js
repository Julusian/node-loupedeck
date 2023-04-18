/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 277:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}


/***/ }),

/***/ 291:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
var __webpack_unused_export__;
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */



const base64 = __webpack_require__(277)
const ieee754 = __webpack_require__(608)
const customInspectSymbol =
  (typeof Symbol === 'function' && typeof Symbol['for'] === 'function') // eslint-disable-line dot-notation
    ? Symbol['for']('nodejs.util.inspect.custom') // eslint-disable-line dot-notation
    : null

exports.lW = Buffer
__webpack_unused_export__ = SlowBuffer
exports.h2 = 50

const K_MAX_LENGTH = 0x7fffffff
__webpack_unused_export__ = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    const arr = new Uint8Array(1)
    const proto = { foo: function () { return 42 } }
    Object.setPrototypeOf(proto, Uint8Array.prototype)
    Object.setPrototypeOf(arr, proto)
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  const buf = new Uint8Array(length)
  Object.setPrototypeOf(buf, Buffer.prototype)
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayView(value)
  }

  if (value == null) {
    throw new TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof SharedArrayBuffer !== 'undefined' &&
      (isInstance(value, SharedArrayBuffer) ||
      (value && isInstance(value.buffer, SharedArrayBuffer)))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  const valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  const b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length)
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype)
Object.setPrototypeOf(Buffer, Uint8Array)

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpreted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  const length = byteLength(string, encoding) | 0
  let buf = createBuffer(length)

  const actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  const length = array.length < 0 ? 0 : checked(array.length) | 0
  const buf = createBuffer(length)
  for (let i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayView (arrayView) {
  if (isInstance(arrayView, Uint8Array)) {
    const copy = new Uint8Array(arrayView)
    return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength)
  }
  return fromArrayLike(arrayView)
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  let buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(buf, Buffer.prototype)

  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    const len = checked(obj.length) | 0
    const buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  let x = a.length
  let y = b.length

  for (let i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  let i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  const buffer = Buffer.allocUnsafe(length)
  let pos = 0
  for (i = 0; i < list.length; ++i) {
    let buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      if (pos + buf.length > buffer.length) {
        if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf)
        buf.copy(buffer, pos)
      } else {
        Uint8Array.prototype.set.call(
          buffer,
          buf,
          pos
        )
      }
    } else if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    } else {
      buf.copy(buffer, pos)
    }
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  const len = string.length
  const mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  let loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  let loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coercion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  const i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  const len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (let i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  const len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (let i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  const len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (let i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  const length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  let str = ''
  const max = exports.h2
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}
if (customInspectSymbol) {
  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  let x = thisEnd - thisStart
  let y = end - start
  const len = Math.min(x, y)

  const thisCopy = this.slice(thisStart, thisEnd)
  const targetCopy = target.slice(start, end)

  for (let i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  let indexSize = 1
  let arrLength = arr.length
  let valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  let i
  if (dir) {
    let foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      let found = true
      for (let j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  const remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  const strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  let i
  for (i = 0; i < length; ++i) {
    const parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  const remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  let loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
      case 'latin1':
      case 'binary':
        return asciiWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  const res = []

  let i = start
  while (i < end) {
    const firstByte = buf[i]
    let codePoint = null
    let bytesPerSequence = (firstByte > 0xEF)
      ? 4
      : (firstByte > 0xDF)
          ? 3
          : (firstByte > 0xBF)
              ? 2
              : 1

    if (i + bytesPerSequence <= end) {
      let secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
const MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  const len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  let res = ''
  let i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  let ret = ''
  end = Math.min(buf.length, end)

  for (let i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  let ret = ''
  end = Math.min(buf.length, end)

  for (let i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  const len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  let out = ''
  for (let i = start; i < end; ++i) {
    out += hexSliceLookupTable[buf[i]]
  }
  return out
}

function utf16leSlice (buf, start, end) {
  const bytes = buf.slice(start, end)
  let res = ''
  // If bytes.length is odd, the last 8 bits must be ignored (same as node.js)
  for (let i = 0; i < bytes.length - 1; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  const len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  const newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(newBuf, Buffer.prototype)

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUintLE =
Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  let val = this[offset]
  let mul = 1
  let i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUintBE =
Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  let val = this[offset + --byteLength]
  let mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUint8 =
Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUint16LE =
Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUint16BE =
Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUint32LE =
Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUint32BE =
Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const lo = first +
    this[++offset] * 2 ** 8 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 24

  const hi = this[++offset] +
    this[++offset] * 2 ** 8 +
    this[++offset] * 2 ** 16 +
    last * 2 ** 24

  return BigInt(lo) + (BigInt(hi) << BigInt(32))
})

Buffer.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const hi = first * 2 ** 24 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    this[++offset]

  const lo = this[++offset] * 2 ** 24 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    last

  return (BigInt(hi) << BigInt(32)) + BigInt(lo)
})

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  let val = this[offset]
  let mul = 1
  let i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  let i = byteLength
  let mul = 1
  let val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  const val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  const val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const val = this[offset + 4] +
    this[offset + 5] * 2 ** 8 +
    this[offset + 6] * 2 ** 16 +
    (last << 24) // Overflow

  return (BigInt(val) << BigInt(32)) +
    BigInt(first +
    this[++offset] * 2 ** 8 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 24)
})

Buffer.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const val = (first << 24) + // Overflow
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    this[++offset]

  return (BigInt(val) << BigInt(32)) +
    BigInt(this[++offset] * 2 ** 24 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    last)
})

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUintLE =
Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    const maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  let mul = 1
  let i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUintBE =
Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    const maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  let i = byteLength - 1
  let mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUint8 =
Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUint16LE =
Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUint16BE =
Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUint32LE =
Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUint32BE =
Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function wrtBigUInt64LE (buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7)

  let lo = Number(value & BigInt(0xffffffff))
  buf[offset++] = lo
  lo = lo >> 8
  buf[offset++] = lo
  lo = lo >> 8
  buf[offset++] = lo
  lo = lo >> 8
  buf[offset++] = lo
  let hi = Number(value >> BigInt(32) & BigInt(0xffffffff))
  buf[offset++] = hi
  hi = hi >> 8
  buf[offset++] = hi
  hi = hi >> 8
  buf[offset++] = hi
  hi = hi >> 8
  buf[offset++] = hi
  return offset
}

function wrtBigUInt64BE (buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7)

  let lo = Number(value & BigInt(0xffffffff))
  buf[offset + 7] = lo
  lo = lo >> 8
  buf[offset + 6] = lo
  lo = lo >> 8
  buf[offset + 5] = lo
  lo = lo >> 8
  buf[offset + 4] = lo
  let hi = Number(value >> BigInt(32) & BigInt(0xffffffff))
  buf[offset + 3] = hi
  hi = hi >> 8
  buf[offset + 2] = hi
  hi = hi >> 8
  buf[offset + 1] = hi
  hi = hi >> 8
  buf[offset] = hi
  return offset + 8
}

Buffer.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE (value, offset = 0) {
  return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
})

Buffer.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE (value, offset = 0) {
  return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
})

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    const limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  let i = 0
  let mul = 1
  let sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    const limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  let i = byteLength - 1
  let mul = 1
  let sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE (value, offset = 0) {
  return wrtBigUInt64LE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
})

Buffer.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE (value, offset = 0) {
  return wrtBigUInt64BE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
})

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  const len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      const code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  } else if (typeof val === 'boolean') {
    val = Number(val)
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  let i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    const bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    const len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// CUSTOM ERRORS
// =============

// Simplified versions from Node, changed for Buffer-only usage
const errors = {}
function E (sym, getMessage, Base) {
  errors[sym] = class NodeError extends Base {
    constructor () {
      super()

      Object.defineProperty(this, 'message', {
        value: getMessage.apply(this, arguments),
        writable: true,
        configurable: true
      })

      // Add the error code to the name to include it in the stack trace.
      this.name = `${this.name} [${sym}]`
      // Access the stack to generate the error message including the error code
      // from the name.
      this.stack // eslint-disable-line no-unused-expressions
      // Reset the name to the actual name.
      delete this.name
    }

    get code () {
      return sym
    }

    set code (value) {
      Object.defineProperty(this, 'code', {
        configurable: true,
        enumerable: true,
        value,
        writable: true
      })
    }

    toString () {
      return `${this.name} [${sym}]: ${this.message}`
    }
  }
}

E('ERR_BUFFER_OUT_OF_BOUNDS',
  function (name) {
    if (name) {
      return `${name} is outside of buffer bounds`
    }

    return 'Attempt to access memory outside buffer bounds'
  }, RangeError)
E('ERR_INVALID_ARG_TYPE',
  function (name, actual) {
    return `The "${name}" argument must be of type number. Received type ${typeof actual}`
  }, TypeError)
E('ERR_OUT_OF_RANGE',
  function (str, range, input) {
    let msg = `The value of "${str}" is out of range.`
    let received = input
    if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
      received = addNumericalSeparator(String(input))
    } else if (typeof input === 'bigint') {
      received = String(input)
      if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
        received = addNumericalSeparator(received)
      }
      received += 'n'
    }
    msg += ` It must be ${range}. Received ${received}`
    return msg
  }, RangeError)

function addNumericalSeparator (val) {
  let res = ''
  let i = val.length
  const start = val[0] === '-' ? 1 : 0
  for (; i >= start + 4; i -= 3) {
    res = `_${val.slice(i - 3, i)}${res}`
  }
  return `${val.slice(0, i)}${res}`
}

// CHECK FUNCTIONS
// ===============

function checkBounds (buf, offset, byteLength) {
  validateNumber(offset, 'offset')
  if (buf[offset] === undefined || buf[offset + byteLength] === undefined) {
    boundsError(offset, buf.length - (byteLength + 1))
  }
}

function checkIntBI (value, min, max, buf, offset, byteLength) {
  if (value > max || value < min) {
    const n = typeof min === 'bigint' ? 'n' : ''
    let range
    if (byteLength > 3) {
      if (min === 0 || min === BigInt(0)) {
        range = `>= 0${n} and < 2${n} ** ${(byteLength + 1) * 8}${n}`
      } else {
        range = `>= -(2${n} ** ${(byteLength + 1) * 8 - 1}${n}) and < 2 ** ` +
                `${(byteLength + 1) * 8 - 1}${n}`
      }
    } else {
      range = `>= ${min}${n} and <= ${max}${n}`
    }
    throw new errors.ERR_OUT_OF_RANGE('value', range, value)
  }
  checkBounds(buf, offset, byteLength)
}

function validateNumber (value, name) {
  if (typeof value !== 'number') {
    throw new errors.ERR_INVALID_ARG_TYPE(name, 'number', value)
  }
}

function boundsError (value, length, type) {
  if (Math.floor(value) !== value) {
    validateNumber(value, type)
    throw new errors.ERR_OUT_OF_RANGE(type || 'offset', 'an integer', value)
  }

  if (length < 0) {
    throw new errors.ERR_BUFFER_OUT_OF_BOUNDS()
  }

  throw new errors.ERR_OUT_OF_RANGE(type || 'offset',
                                    `>= ${type ? 1 : 0} and <= ${length}`,
                                    value)
}

// HELPER FUNCTIONS
// ================

const INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  let codePoint
  const length = string.length
  let leadSurrogate = null
  const bytes = []

  for (let i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  const byteArray = []
  for (let i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  let c, hi, lo
  const byteArray = []
  for (let i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  let i
  for (i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

// Create lookup table for `toString('hex')`
// See: https://github.com/feross/buffer/issues/219
const hexSliceLookupTable = (function () {
  const alphabet = '0123456789abcdef'
  const table = new Array(256)
  for (let i = 0; i < 16; ++i) {
    const i16 = i * 16
    for (let j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j]
    }
  }
  return table
})()

// Return not function with Error if BigInt not supported
function defineBigIntMethod (fn) {
  return typeof BigInt === 'undefined' ? BufferBigIntNotDefined : fn
}

function BufferBigIntNotDefined () {
  throw new Error('BigInt not supported')
}


/***/ }),

/***/ 399:
/***/ ((module) => {

"use strict";


var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if (true) {
  module.exports = EventEmitter;
}


/***/ }),

/***/ 608:
/***/ ((__unused_webpack_module, exports) => {

/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}


/***/ }),

/***/ 490:
/***/ ((module) => {

"use strict";

module.exports = (promise, onFinally) => {
	onFinally = onFinally || (() => {});

	return promise.then(
		val => new Promise(resolve => {
			resolve(onFinally());
		}).then(() => val),
		err => new Promise(resolve => {
			resolve(onFinally());
		}).then(() => {
			throw err;
		})
	);
};


/***/ }),

/***/ 10:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const EventEmitter = __webpack_require__(399);
const p_timeout_1 = __webpack_require__(605);
const priority_queue_1 = __webpack_require__(986);
// eslint-disable-next-line @typescript-eslint/no-empty-function
const empty = () => { };
const timeoutError = new p_timeout_1.TimeoutError();
/**
Promise queue with concurrency control.
*/
class PQueue extends EventEmitter {
    constructor(options) {
        var _a, _b, _c, _d;
        super();
        this._intervalCount = 0;
        this._intervalEnd = 0;
        this._pendingCount = 0;
        this._resolveEmpty = empty;
        this._resolveIdle = empty;
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        options = Object.assign({ carryoverConcurrencyCount: false, intervalCap: Infinity, interval: 0, concurrency: Infinity, autoStart: true, queueClass: priority_queue_1.default }, options);
        if (!(typeof options.intervalCap === 'number' && options.intervalCap >= 1)) {
            throw new TypeError(`Expected \`intervalCap\` to be a number from 1 and up, got \`${(_b = (_a = options.intervalCap) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : ''}\` (${typeof options.intervalCap})`);
        }
        if (options.interval === undefined || !(Number.isFinite(options.interval) && options.interval >= 0)) {
            throw new TypeError(`Expected \`interval\` to be a finite number >= 0, got \`${(_d = (_c = options.interval) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ''}\` (${typeof options.interval})`);
        }
        this._carryoverConcurrencyCount = options.carryoverConcurrencyCount;
        this._isIntervalIgnored = options.intervalCap === Infinity || options.interval === 0;
        this._intervalCap = options.intervalCap;
        this._interval = options.interval;
        this._queue = new options.queueClass();
        this._queueClass = options.queueClass;
        this.concurrency = options.concurrency;
        this._timeout = options.timeout;
        this._throwOnTimeout = options.throwOnTimeout === true;
        this._isPaused = options.autoStart === false;
    }
    get _doesIntervalAllowAnother() {
        return this._isIntervalIgnored || this._intervalCount < this._intervalCap;
    }
    get _doesConcurrentAllowAnother() {
        return this._pendingCount < this._concurrency;
    }
    _next() {
        this._pendingCount--;
        this._tryToStartAnother();
        this.emit('next');
    }
    _resolvePromises() {
        this._resolveEmpty();
        this._resolveEmpty = empty;
        if (this._pendingCount === 0) {
            this._resolveIdle();
            this._resolveIdle = empty;
            this.emit('idle');
        }
    }
    _onResumeInterval() {
        this._onInterval();
        this._initializeIntervalIfNeeded();
        this._timeoutId = undefined;
    }
    _isIntervalPaused() {
        const now = Date.now();
        if (this._intervalId === undefined) {
            const delay = this._intervalEnd - now;
            if (delay < 0) {
                // Act as the interval was done
                // We don't need to resume it here because it will be resumed on line 160
                this._intervalCount = (this._carryoverConcurrencyCount) ? this._pendingCount : 0;
            }
            else {
                // Act as the interval is pending
                if (this._timeoutId === undefined) {
                    this._timeoutId = setTimeout(() => {
                        this._onResumeInterval();
                    }, delay);
                }
                return true;
            }
        }
        return false;
    }
    _tryToStartAnother() {
        if (this._queue.size === 0) {
            // We can clear the interval ("pause")
            // Because we can redo it later ("resume")
            if (this._intervalId) {
                clearInterval(this._intervalId);
            }
            this._intervalId = undefined;
            this._resolvePromises();
            return false;
        }
        if (!this._isPaused) {
            const canInitializeInterval = !this._isIntervalPaused();
            if (this._doesIntervalAllowAnother && this._doesConcurrentAllowAnother) {
                const job = this._queue.dequeue();
                if (!job) {
                    return false;
                }
                this.emit('active');
                job();
                if (canInitializeInterval) {
                    this._initializeIntervalIfNeeded();
                }
                return true;
            }
        }
        return false;
    }
    _initializeIntervalIfNeeded() {
        if (this._isIntervalIgnored || this._intervalId !== undefined) {
            return;
        }
        this._intervalId = setInterval(() => {
            this._onInterval();
        }, this._interval);
        this._intervalEnd = Date.now() + this._interval;
    }
    _onInterval() {
        if (this._intervalCount === 0 && this._pendingCount === 0 && this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = undefined;
        }
        this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0;
        this._processQueue();
    }
    /**
    Executes all queued functions until it reaches the limit.
    */
    _processQueue() {
        // eslint-disable-next-line no-empty
        while (this._tryToStartAnother()) { }
    }
    get concurrency() {
        return this._concurrency;
    }
    set concurrency(newConcurrency) {
        if (!(typeof newConcurrency === 'number' && newConcurrency >= 1)) {
            throw new TypeError(`Expected \`concurrency\` to be a number from 1 and up, got \`${newConcurrency}\` (${typeof newConcurrency})`);
        }
        this._concurrency = newConcurrency;
        this._processQueue();
    }
    /**
    Adds a sync or async task to the queue. Always returns a promise.
    */
    async add(fn, options = {}) {
        return new Promise((resolve, reject) => {
            const run = async () => {
                this._pendingCount++;
                this._intervalCount++;
                try {
                    const operation = (this._timeout === undefined && options.timeout === undefined) ? fn() : p_timeout_1.default(Promise.resolve(fn()), (options.timeout === undefined ? this._timeout : options.timeout), () => {
                        if (options.throwOnTimeout === undefined ? this._throwOnTimeout : options.throwOnTimeout) {
                            reject(timeoutError);
                        }
                        return undefined;
                    });
                    resolve(await operation);
                }
                catch (error) {
                    reject(error);
                }
                this._next();
            };
            this._queue.enqueue(run, options);
            this._tryToStartAnother();
            this.emit('add');
        });
    }
    /**
    Same as `.add()`, but accepts an array of sync or async functions.

    @returns A promise that resolves when all functions are resolved.
    */
    async addAll(functions, options) {
        return Promise.all(functions.map(async (function_) => this.add(function_, options)));
    }
    /**
    Start (or resume) executing enqueued tasks within concurrency limit. No need to call this if queue is not paused (via `options.autoStart = false` or by `.pause()` method.)
    */
    start() {
        if (!this._isPaused) {
            return this;
        }
        this._isPaused = false;
        this._processQueue();
        return this;
    }
    /**
    Put queue execution on hold.
    */
    pause() {
        this._isPaused = true;
    }
    /**
    Clear the queue.
    */
    clear() {
        this._queue = new this._queueClass();
    }
    /**
    Can be called multiple times. Useful if you for example add additional items at a later time.

    @returns A promise that settles when the queue becomes empty.
    */
    async onEmpty() {
        // Instantly resolve if the queue is empty
        if (this._queue.size === 0) {
            return;
        }
        return new Promise(resolve => {
            const existingResolve = this._resolveEmpty;
            this._resolveEmpty = () => {
                existingResolve();
                resolve();
            };
        });
    }
    /**
    The difference with `.onEmpty` is that `.onIdle` guarantees that all work from the queue has finished. `.onEmpty` merely signals that the queue is empty, but it could mean that some promises haven't completed yet.

    @returns A promise that settles when the queue becomes empty, and all promises have completed; `queue.size === 0 && queue.pending === 0`.
    */
    async onIdle() {
        // Instantly resolve if none pending and if nothing else is queued
        if (this._pendingCount === 0 && this._queue.size === 0) {
            return;
        }
        return new Promise(resolve => {
            const existingResolve = this._resolveIdle;
            this._resolveIdle = () => {
                existingResolve();
                resolve();
            };
        });
    }
    /**
    Size of the queue.
    */
    get size() {
        return this._queue.size;
    }
    /**
    Size of the queue, filtered by the given options.

    For example, this can be used to find the number of items remaining in the queue with a specific priority level.
    */
    sizeBy(options) {
        // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
        return this._queue.filter(options).length;
    }
    /**
    Number of pending promises.
    */
    get pending() {
        return this._pendingCount;
    }
    /**
    Whether the queue is currently paused.
    */
    get isPaused() {
        return this._isPaused;
    }
    get timeout() {
        return this._timeout;
    }
    /**
    Set the timeout for future operations.
    */
    set timeout(milliseconds) {
        this._timeout = milliseconds;
    }
}
exports["default"] = PQueue;


/***/ }),

/***/ 982:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
// Port of lower_bound from https://en.cppreference.com/w/cpp/algorithm/lower_bound
// Used to compute insertion index to keep queue sorted after insertion
function lowerBound(array, value, comparator) {
    let first = 0;
    let count = array.length;
    while (count > 0) {
        const step = (count / 2) | 0;
        let it = first + step;
        if (comparator(array[it], value) <= 0) {
            first = ++it;
            count -= step + 1;
        }
        else {
            count = step;
        }
    }
    return first;
}
exports["default"] = lowerBound;


/***/ }),

/***/ 986:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const lower_bound_1 = __webpack_require__(982);
class PriorityQueue {
    constructor() {
        this._queue = [];
    }
    enqueue(run, options) {
        options = Object.assign({ priority: 0 }, options);
        const element = {
            priority: options.priority,
            run
        };
        if (this.size && this._queue[this.size - 1].priority >= options.priority) {
            this._queue.push(element);
            return;
        }
        const index = lower_bound_1.default(this._queue, element, (a, b) => b.priority - a.priority);
        this._queue.splice(index, 0, element);
    }
    dequeue() {
        const item = this._queue.shift();
        return item === null || item === void 0 ? void 0 : item.run;
    }
    filter(options) {
        return this._queue.filter((element) => element.priority === options.priority).map((element) => element.run);
    }
    get size() {
        return this._queue.length;
    }
}
exports["default"] = PriorityQueue;


/***/ }),

/***/ 605:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const pFinally = __webpack_require__(490);

class TimeoutError extends Error {
	constructor(message) {
		super(message);
		this.name = 'TimeoutError';
	}
}

const pTimeout = (promise, milliseconds, fallback) => new Promise((resolve, reject) => {
	if (typeof milliseconds !== 'number' || milliseconds < 0) {
		throw new TypeError('Expected `milliseconds` to be a positive number');
	}

	if (milliseconds === Infinity) {
		resolve(promise);
		return;
	}

	const timer = setTimeout(() => {
		if (typeof fallback === 'function') {
			try {
				resolve(fallback());
			} catch (error) {
				reject(error);
			}

			return;
		}

		const message = typeof fallback === 'string' ? fallback : `Promise timed out after ${milliseconds} milliseconds`;
		const timeoutError = fallback instanceof Error ? fallback : new TimeoutError(message);

		if (typeof promise.cancel === 'function') {
			promise.cancel();
		}

		reject(timeoutError);
	}, milliseconds);

	// TODO: Use native `finally` keyword when targeting Node.js 10
	pFinally(
		// eslint-disable-next-line promise/prefer-await-to-then
		promise.then(resolve, reject),
		() => {
			clearTimeout(timer);
		}
	);
});

module.exports = pTimeout;
// TODO: Remove this for the next major release
module.exports["default"] = pTimeout;

module.exports.TimeoutError = TimeoutError;


/***/ }),

/***/ 306:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var Buffer = __webpack_require__(291)["lW"];

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FillWhenPressedDemo = void 0;
const web_1 = __webpack_require__(660);
function stringifyInfo(info) {
    return `${info.type}-${info.index}`;
}
const colorRed = { red: 255, green: 0, blue: 0 };
const colorBlack = { red: 0, green: 0, blue: 0 };
const bufferRed = Buffer.alloc(80 * 80 * 3, Buffer.from([255, 0, 0]));
const bufferBlack = Buffer.alloc(80 * 80 * 3);
class FillWhenPressedDemo {
    constructor() {
        this.pressed = [];
        this.touchBoxes = new Set();
        this.touchingLeft = false;
        this.touchingRight = false;
    }
    async start(device) {
        await device.blankDevice(true, false);
    }
    async stop(device) {
        await device.blankDevice(true, false);
    }
    async controlDown(device, info) {
        const id = stringifyInfo(info);
        if (this.pressed.indexOf(id) === -1) {
            this.pressed.push(id);
            if (device.modelId === web_1.LoupedeckModelId.RazerStreamControllerX) {
                await device.drawKeyBuffer(info.index, bufferRed, web_1.LoupedeckBufferFormat.RGB);
            }
            else {
                await device.setButtonColor({ id: info.index, ...colorRed });
            }
        }
    }
    async controlUp(device, info) {
        const id = stringifyInfo(info);
        const index = this.pressed.indexOf(id);
        if (index !== -1) {
            this.pressed.splice(index, 1);
            if (device.modelId === web_1.LoupedeckModelId.RazerStreamControllerX) {
                await device.drawKeyBuffer(info.index, bufferBlack, web_1.LoupedeckBufferFormat.RGB);
            }
            else {
                await device.setButtonColor({ id: info.index, ...colorBlack });
            }
        }
    }
    async controlRotate(_device, _info, _delta) {
        // Ignored
    }
    async touchStart(device, event) {
        return this.touchMove(device, event);
    }
    async touchMove(device, event) {
        const ps = [];
        const newIds = new Set();
        let leftPercent = 0;
        let rightPercent = 0;
        for (const touch of event.touches) {
            if (touch.target.screen === web_1.LoupedeckDisplayId.Center && touch.target.key !== undefined) {
                newIds.add(touch.target.key);
                if (!this.touchBoxes.has(touch.target.key)) {
                    this.touchBoxes.add(touch.target.key);
                    ps.push(device.drawKeyBuffer(touch.target.key, bufferRed, web_1.LoupedeckBufferFormat.RGB));
                }
            }
            else if (touch.target.screen === web_1.LoupedeckDisplayId.Left && device.displayLeftStrip) {
                const percent = touch.y / device.displayLeftStrip.height;
                leftPercent = Math.max(leftPercent, percent);
            }
            else if (touch.target.screen === web_1.LoupedeckDisplayId.Right && device.displayRightStrip) {
                const percent = touch.y / device.displayRightStrip.height;
                rightPercent = Math.max(rightPercent, percent);
            }
        }
        for (const key of this.touchBoxes) {
            if (!newIds.has(key)) {
                this.touchBoxes.delete(key);
                ps.push(device.drawKeyBuffer(key, bufferBlack, web_1.LoupedeckBufferFormat.RGB));
            }
        }
        if (device.displayLeftStrip && (leftPercent > 0 || this.touchingLeft)) {
            this.touchingLeft = leftPercent > 0;
            ps.push(device.drawSolidColour(web_1.LoupedeckDisplayId.Left, { red: Math.round(255 * leftPercent), green: 0, blue: 0 }, device.displayLeftStrip.width, device.displayLeftStrip.height, 0, 0));
        }
        if (device.displayRightStrip && (rightPercent > 0 || this.touchingRight)) {
            this.touchingRight = rightPercent > 0;
            ps.push(device.drawSolidColour(web_1.LoupedeckDisplayId.Right, { red: Math.round(255 * rightPercent), green: 0, blue: 0 }, device.displayRightStrip.width, device.displayRightStrip.height, 0, 0));
        }
        await Promise.allSettled(ps);
    }
    async touchEnd(device, event) {
        return this.touchMove(device, event);
    }
}
exports.FillWhenPressedDemo = FillWhenPressedDemo;


/***/ }),

/***/ 283:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RapidFillDemo = void 0;
const web_1 = __webpack_require__(660);
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
class RapidFillDemo {
    async start(device) {
        if (!this.interval) {
            const doThing = async () => {
                if (!this.running) {
                    const color = {
                        red: getRandomIntInclusive(0, 255),
                        green: getRandomIntInclusive(0, 255),
                        blue: getRandomIntInclusive(0, 255),
                    };
                    console.log('Filling with rgb(%d, %d, %d)', color.red, color.green, color.blue);
                    this.running = Promise.all([
                        device.drawSolidColour(web_1.LoupedeckDisplayId.Center, color, device.displayMain.width, device.displayMain.height, 0, 0),
                        device.displayLeftStrip
                            ? device.drawSolidColour(web_1.LoupedeckDisplayId.Left, color, device.displayLeftStrip.width, device.displayLeftStrip.height, 0, 0)
                            : undefined,
                        device.displayRightStrip
                            ? device.drawSolidColour(web_1.LoupedeckDisplayId.Right, color, device.displayRightStrip.width, device.displayRightStrip.height, 0, 0)
                            : undefined,
                        // TODO fix
                        // device.setButtonColor(
                        // 	...(device.controls
                        // 		.map((control) => {
                        // 			if (control.type === LoupedeckControlType.Button) {
                        // 				return { id: control.index, ...color }
                        // 			} else {
                        // 				return undefined
                        // 			}
                        // 		})
                        // 		.filter((c) => !!c) as any[])
                        // ),
                    ]);
                    try {
                        await this.running;
                    }
                    finally {
                        this.running = undefined;
                    }
                }
            };
            this.interval = window.setInterval(() => {
                doThing().catch((e) => console.log(e));
            }, 1000 / 5);
        }
    }
    async stop(device) {
        if (this.interval) {
            window.clearInterval(this.interval);
            this.interval = undefined;
        }
        await this.running;
        await device.blankDevice(true, true);
    }
    async controlDown(_device, _info) {
        // Nothing to do
    }
    async controlUp(_device, _info) {
        // Nothing to do
    }
    async controlRotate(_device, _info, _delta) {
        // Nothing to do
    }
    async touchStart(_device, _event) {
        // Nothing to do
    }
    async touchMove(_device, _event) {
        // Nothing to do
    }
    async touchEnd(_device, _event) {
        // Nothing to do
    }
}
exports.RapidFillDemo = RapidFillDemo;


/***/ }),

/***/ 843:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var Buffer = __webpack_require__(291)["lW"];

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LoupedeckBufferFormat = exports.DisplayCenterEncodedId = exports.LoupedeckDisplayId = exports.LoupedeckVibratePattern = exports.LoupedeckControlType = exports.VendorIdRazer = exports.VendorIdLoupedeck = void 0;
exports.VendorIdLoupedeck = 0x2ec2;
exports.VendorIdRazer = 0x1532;
var LoupedeckControlType;
(function (LoupedeckControlType) {
    LoupedeckControlType["Button"] = "button";
    LoupedeckControlType["Rotary"] = "rotary";
})(LoupedeckControlType = exports.LoupedeckControlType || (exports.LoupedeckControlType = {}));
var LoupedeckVibratePattern;
(function (LoupedeckVibratePattern) {
    LoupedeckVibratePattern[LoupedeckVibratePattern["SHORT"] = 1] = "SHORT";
    LoupedeckVibratePattern[LoupedeckVibratePattern["MEDIUM"] = 10] = "MEDIUM";
    LoupedeckVibratePattern[LoupedeckVibratePattern["LONG"] = 15] = "LONG";
    LoupedeckVibratePattern[LoupedeckVibratePattern["LOW"] = 49] = "LOW";
    LoupedeckVibratePattern[LoupedeckVibratePattern["SHORT_LOW"] = 50] = "SHORT_LOW";
    LoupedeckVibratePattern[LoupedeckVibratePattern["SHORT_LOWER"] = 51] = "SHORT_LOWER";
    LoupedeckVibratePattern[LoupedeckVibratePattern["LOWER"] = 64] = "LOWER";
    LoupedeckVibratePattern[LoupedeckVibratePattern["LOWEST"] = 65] = "LOWEST";
    LoupedeckVibratePattern[LoupedeckVibratePattern["DESCEND_SLOW"] = 70] = "DESCEND_SLOW";
    LoupedeckVibratePattern[LoupedeckVibratePattern["DESCEND_MED"] = 71] = "DESCEND_MED";
    LoupedeckVibratePattern[LoupedeckVibratePattern["DESCEND_FAST"] = 72] = "DESCEND_FAST";
    LoupedeckVibratePattern[LoupedeckVibratePattern["ASCEND_SLOW"] = 82] = "ASCEND_SLOW";
    LoupedeckVibratePattern[LoupedeckVibratePattern["ASCEND_MED"] = 83] = "ASCEND_MED";
    LoupedeckVibratePattern[LoupedeckVibratePattern["ASCEND_FAST"] = 88] = "ASCEND_FAST";
    LoupedeckVibratePattern[LoupedeckVibratePattern["REV_SLOWEST"] = 94] = "REV_SLOWEST";
    LoupedeckVibratePattern[LoupedeckVibratePattern["REV_SLOW"] = 95] = "REV_SLOW";
    LoupedeckVibratePattern[LoupedeckVibratePattern["REV_MED"] = 96] = "REV_MED";
    LoupedeckVibratePattern[LoupedeckVibratePattern["REV_FAST"] = 97] = "REV_FAST";
    LoupedeckVibratePattern[LoupedeckVibratePattern["REV_FASTER"] = 98] = "REV_FASTER";
    LoupedeckVibratePattern[LoupedeckVibratePattern["REV_FASTEST"] = 99] = "REV_FASTEST";
    LoupedeckVibratePattern[LoupedeckVibratePattern["RISE_FALL"] = 106] = "RISE_FALL";
    LoupedeckVibratePattern[LoupedeckVibratePattern["BUZZ"] = 112] = "BUZZ";
    LoupedeckVibratePattern[LoupedeckVibratePattern["RUMBLE5"] = 119] = "RUMBLE5";
    LoupedeckVibratePattern[LoupedeckVibratePattern["RUMBLE4"] = 120] = "RUMBLE4";
    LoupedeckVibratePattern[LoupedeckVibratePattern["RUMBLE3"] = 121] = "RUMBLE3";
    LoupedeckVibratePattern[LoupedeckVibratePattern["RUMBLE2"] = 122] = "RUMBLE2";
    LoupedeckVibratePattern[LoupedeckVibratePattern["RUMBLE1"] = 123] = "RUMBLE1";
    /**
     *  10 sec high freq (!)
     */
    LoupedeckVibratePattern[LoupedeckVibratePattern["VERY_LONG"] = 118] = "VERY_LONG";
})(LoupedeckVibratePattern = exports.LoupedeckVibratePattern || (exports.LoupedeckVibratePattern = {}));
var LoupedeckDisplayId;
(function (LoupedeckDisplayId) {
    LoupedeckDisplayId["Left"] = "left";
    LoupedeckDisplayId["Center"] = "center";
    LoupedeckDisplayId["Right"] = "right";
})(LoupedeckDisplayId = exports.LoupedeckDisplayId || (exports.LoupedeckDisplayId = {}));
exports.DisplayCenterEncodedId = Buffer.from([0x00, 0x4d]);
var LoupedeckBufferFormat;
(function (LoupedeckBufferFormat) {
    LoupedeckBufferFormat["RGB"] = "rgb";
})(LoupedeckBufferFormat = exports.LoupedeckBufferFormat || (exports.LoupedeckBufferFormat = {}));
//# sourceMappingURL=constants.js.map

/***/ }),

/***/ 494:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
//# sourceMappingURL=events.js.map

/***/ }),

/***/ 613:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(843), exports);
__exportStar(__webpack_require__(494), exports);
__exportStar(__webpack_require__(970), exports);
__exportStar(__webpack_require__(72), exports);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 970:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LoupedeckModelId = void 0;
var LoupedeckModelId;
(function (LoupedeckModelId) {
    LoupedeckModelId["LoupedeckLive"] = "loupedeck-live";
    LoupedeckModelId["LoupedeckLiveS"] = "loupedeck-live-s";
    LoupedeckModelId["RazerStreamController"] = "razer-stream-controller";
    LoupedeckModelId["RazerStreamControllerX"] = "razer-stream-controller-x";
})(LoupedeckModelId = exports.LoupedeckModelId || (exports.LoupedeckModelId = {}));
//# sourceMappingURL=info.js.map

/***/ }),

/***/ 276:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var Buffer = __webpack_require__(291)["lW"];

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WS_UPGRADE_RESPONSE = exports.WS_UPGRADE_HEADER = exports.DEVICE_MODELS = void 0;
var list_1 = __webpack_require__(113);
Object.defineProperty(exports, "DEVICE_MODELS", ({ enumerable: true, get: function () { return list_1.DEVICE_MODELS; } }));
exports.WS_UPGRADE_HEADER = Buffer.from(`GET /index.html
HTTP/1.1
Connection: Upgrade
Upgrade: websocket
Sec-WebSocket-Key: 123abc

`);
exports.WS_UPGRADE_RESPONSE = 'HTTP/1.1';
//# sourceMappingURL=internal.js.map

/***/ }),

/***/ 576:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";
/* provided dependency */ var Buffer = __webpack_require__(291)["lW"];

var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _LoupedeckDeviceBase_instances, _LoupedeckDeviceBase_touches, _LoupedeckDeviceBase_connection, _LoupedeckDeviceBase_pendingTransactions, _LoupedeckDeviceBase_nextTransactionId, _LoupedeckDeviceBase_sendQueue, _LoupedeckDeviceBase_getDisplay, _LoupedeckDeviceBase_cleanupPendingPromises, _LoupedeckDeviceBase_onMessage, _LoupedeckDeviceBase_onPress, _LoupedeckDeviceBase_onRotate, _LoupedeckDeviceBase_runInQueueIfEnabled, _LoupedeckDeviceBase_sendAndWaitIfRequired, _LoupedeckDeviceBase_sendAndWaitForResult, _LoupedeckDeviceBase_sendCommand, _LoupedeckDeviceBase_waitForTransaction;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LoupedeckDeviceBase = void 0;
const eventemitter3_1 = __webpack_require__(399);
const constants_1 = __webpack_require__(843);
const util_1 = __webpack_require__(764);
const p_queue_1 = __webpack_require__(10);
var CommandIds;
(function (CommandIds) {
    CommandIds[CommandIds["SetColour"] = 2] = "SetColour";
    CommandIds[CommandIds["GetSerialNumber"] = 3] = "GetSerialNumber";
    CommandIds[CommandIds["GetVersion"] = 7] = "GetVersion";
    CommandIds[CommandIds["SetBrightness"] = 9] = "SetBrightness";
    // RefreshDisplay = 0x0f,
    CommandIds[CommandIds["DrawFramebuffer"] = 16] = "DrawFramebuffer";
    CommandIds[CommandIds["SetVibration"] = 27] = "SetVibration";
    // CONFIRM: 0x0302,
    // TICK: 0x0400,
    // BUTTON_PRESS: 0x0500,
    // KNOB_ROTATE: 0x0501,
    // RESET: 0x0506,
    // MCU: 0x180d,
})(CommandIds || (CommandIds = {}));
class LoupedeckDeviceBase extends eventemitter3_1.EventEmitter {
    // protected readonly displays: LoupedeckDisplayDefinition[]
    get controls() {
        return this.modelSpec.controls;
    }
    get displayMain() {
        return this.modelSpec.displayMain;
    }
    get displayLeftStrip() {
        return this.modelSpec.displayLeftStrip;
    }
    get displayRightStrip() {
        return this.modelSpec.displayRightStrip;
    }
    constructor(connection, options, modelSpec) {
        super();
        _LoupedeckDeviceBase_instances.add(this);
        _LoupedeckDeviceBase_touches.set(this, {});
        _LoupedeckDeviceBase_connection.set(this, void 0);
        _LoupedeckDeviceBase_pendingTransactions.set(this, {});
        _LoupedeckDeviceBase_nextTransactionId.set(this, 0);
        _LoupedeckDeviceBase_sendQueue.set(this, void 0);
        __classPrivateFieldSet(this, _LoupedeckDeviceBase_connection, connection, "f");
        this.options = { ...options };
        this.modelSpec = modelSpec;
        if (!this.options.skipWaitForAcks) {
            __classPrivateFieldSet(this, _LoupedeckDeviceBase_sendQueue, new p_queue_1.default({
                concurrency: 1,
            }), "f");
        }
        __classPrivateFieldGet(this, _LoupedeckDeviceBase_connection, "f").on('error', (err) => {
            __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_cleanupPendingPromises).call(this);
            this.emit('error', err);
        });
        __classPrivateFieldGet(this, _LoupedeckDeviceBase_connection, "f").on('disconnect', () => {
            // TODO - not if closed?
            __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_cleanupPendingPromises).call(this);
            this.emit('error', new Error('Connection lost'));
        });
        __classPrivateFieldGet(this, _LoupedeckDeviceBase_connection, "f").on('message', __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_onMessage).bind(this));
    }
    get modelId() {
        return this.modelSpec.modelId;
    }
    get modelName() {
        return this.modelSpec.modelName;
    }
    get lcdKeyColumns() {
        return this.modelSpec.lcdKeyColumns;
    }
    get lcdKeyRows() {
        return this.modelSpec.lcdKeyRows;
    }
    get lcdKeySize() {
        return this.modelSpec.lcdKeySize;
    }
    async blankDevice(doDisplays = true, doButtons = true) {
        // These steps are done manually, so that it is one operation in the queue, otherwise behaviour is a little non-deterministic
        await __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_runInQueueIfEnabled).call(this, async () => {
            if (doDisplays) {
                for (const displayId of Object.values(constants_1.LoupedeckDisplayId)) {
                    const display = __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_getDisplay).call(this, displayId);
                    if (display) {
                        const [payload] = this.createBufferWithHeader(displayId, display.width + display.xPadding * 2, display.height + display.yPadding * 2, 0, 0);
                        await __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_sendAndWaitIfRequired).call(this, CommandIds.DrawFramebuffer, payload, true);
                    }
                }
            }
            if (doButtons) {
                const buttons = this.controls.filter((c) => c.type === constants_1.LoupedeckControlType.Button);
                const payload = Buffer.alloc(4 * buttons.length);
                for (let i = 0; i < buttons.length; i++) {
                    payload.writeUInt8(buttons[i].encoded, i * 4);
                }
                await __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_sendAndWaitIfRequired).call(this, CommandIds.SetColour, payload, true);
            }
        }, false);
    }
    async close() {
        __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_cleanupPendingPromises).call(this);
        await __classPrivateFieldGet(this, _LoupedeckDeviceBase_connection, "f").close();
    }
    convertKeyIndexToCoordinates(index, display) {
        const cols = this.lcdKeyColumns;
        const width = this.lcdKeySize + (display.columnGap ?? 0);
        const height = this.lcdKeySize + (display.rowGap ?? 0);
        const x = (index % cols) * width;
        const y = Math.floor(index / cols) * height;
        return [x, y];
    }
    /**
     * Create a buffer with the header predefined.
     * @returns The buffer and the data offset
     */
    createBufferWithHeader(displayId, width, height, x, y) {
        if (displayId === constants_1.LoupedeckDisplayId.Left) {
            // Nothing to do
        }
        else if (displayId === constants_1.LoupedeckDisplayId.Center) {
            x += this.displayLeftStrip?.width ?? 0;
        }
        else if (displayId === constants_1.LoupedeckDisplayId.Right) {
            x += (this.displayLeftStrip?.width ?? 0) + (this.displayMain.width + this.displayMain.xPadding * 2);
        }
        else {
            throw new Error('Unknown DisplayId');
        }
        const padding = 10; // header + id
        const pixelCount = width * height;
        const encoded = Buffer.alloc(pixelCount * 2 + padding);
        constants_1.DisplayCenterEncodedId.copy(encoded, 0);
        encoded.writeUInt16BE(x, 2);
        encoded.writeUInt16BE(y, 4);
        encoded.writeUInt16BE(width, 6);
        encoded.writeUInt16BE(height, 8);
        return [encoded, padding];
    }
    async drawBuffer(displayId, buffer, format, width, height, x, y) {
        const display = __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_getDisplay).call(this, displayId);
        if (!display)
            throw new Error('Invalid DisplayId');
        if (width < 0 || width > display.width)
            throw new Error('Image width is not valid');
        if (height < 0 || height > display.height)
            throw new Error('Image width is not valid');
        if (x < 0 || x + width > display.width)
            throw new Error('x is not valid');
        if (y < 0 || y + height > display.height)
            throw new Error('x is not valid');
        const [encoded, padding] = this.createBufferWithHeader(displayId, width, height, x + display.xPadding, y + display.yPadding);
        const [canDrawPixel, canDrawRow] = (0, util_1.createCanDrawPixel)(x, y, this.lcdKeySize, display);
        (0, util_1.encodeBuffer)(buffer, encoded, format, padding, width, height, canDrawPixel, canDrawRow);
        await __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_runInQueueIfEnabled).call(this, async () => {
            // Run in the queue as a single operation
            await __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_sendAndWaitIfRequired).call(this, CommandIds.DrawFramebuffer, encoded, true);
        }, false);
    }
    async drawKeyBuffer(index, buffer, format) {
        const [x, y] = this.convertKeyIndexToCoordinates(index, this.displayMain);
        const size = this.lcdKeySize;
        return this.drawBuffer(constants_1.LoupedeckDisplayId.Center, buffer, format, size, size, x, y);
    }
    async drawSolidColour(displayId, color, width, height, x, y) {
        const display = __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_getDisplay).call(this, displayId);
        if (!display)
            throw new Error('Invalid DisplayId');
        if (width < 0 || width > display.width)
            throw new Error('Image width is not valid');
        if (height < 0 || height > display.height)
            throw new Error('Image height is not valid');
        if (x < 0 || x + width > display.width)
            throw new Error('x is not valid');
        if (y < 0 || y + height > display.height)
            throw new Error('y is not valid');
        (0, util_1.checkRGBColor)(color);
        const encodedValue = (((Math.round(color.red) >> 3) & 0b11111) << 11) +
            (((Math.round(color.green) >> 2) & 0b111111) << 5) +
            ((Math.round(color.blue) >> 3) & 0b11111);
        const [canDrawPixel, canDrawRow] = (0, util_1.createCanDrawPixel)(x, y, this.lcdKeySize, display);
        const [encoded, padding] = this.createBufferWithHeader(displayId, width, height, x + display.xPadding, y);
        for (let y = 0; y < height; y++) {
            if (!canDrawRow(y))
                continue;
            for (let x = 0; x < width; x++) {
                if (canDrawPixel(x, y)) {
                    const i = y * width + x;
                    encoded.writeUint16LE(encodedValue, i * 2 + padding);
                }
            }
        }
        await __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_runInQueueIfEnabled).call(this, async () => {
            // Run in the queue as a single operation
            await __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_sendAndWaitIfRequired).call(this, CommandIds.DrawFramebuffer, encoded, true);
        }, false);
    }
    async getFirmwareVersion() {
        const buffer = await __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_sendAndWaitForResult).call(this, CommandIds.GetVersion, undefined);
        return `${buffer.readUInt8(0)}.${buffer.readUInt8(1)}.${buffer.readUInt8(2)}`;
    }
    async getSerialNumber() {
        const buffer = await __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_sendAndWaitForResult).call(this, CommandIds.GetSerialNumber, undefined);
        return buffer.toString().trim();
    }
    // protected abstract onTouch(event: 'touchmove' | 'touchend' | 'touchstart', buff: Buffer): void
    onTouch(event, buff) {
        // Parse buffer
        let x = buff.readUInt16BE(1);
        let y = buff.readUInt16BE(3);
        const id = buff.readUInt8(5);
        const mainFullWidth = this.displayMain.width + this.displayMain.xPadding * 2;
        const leftWidth = this.displayLeftStrip?.width ?? 0;
        // Figure out which screen was touched
        let screen = constants_1.LoupedeckDisplayId.Center;
        const rightX = (this.displayLeftStrip?.width ?? 0) + mainFullWidth;
        if (this.displayLeftStrip && x < leftWidth) {
            screen = constants_1.LoupedeckDisplayId.Left;
        }
        else if (this.displayRightStrip && x >= rightX) {
            screen = constants_1.LoupedeckDisplayId.Right;
            x -= rightX;
        }
        else {
            // else center
            x -= leftWidth + this.displayMain.xPadding;
            y -= this.displayMain.yPadding;
        }
        let key;
        if (screen === constants_1.LoupedeckDisplayId.Center) {
            // Pad by half the gap, to make the maths simpler
            const xPadded = x + this.displayMain.columnGap / 2;
            const yPadded = y + this.displayMain.rowGap / 2;
            // Find the column, including the gap as evenly distributed
            const column = Math.floor(xPadded / (this.lcdKeySize + this.displayMain.columnGap));
            const row = Math.floor(yPadded / (this.lcdKeySize + this.displayMain.rowGap));
            key = row * this.lcdKeyColumns + column;
        }
        // Create touch
        const touch = { x, y, id, target: { screen, key } };
        // End touch, remove from local cache
        if (event === 'touchend') {
            delete __classPrivateFieldGet(this, _LoupedeckDeviceBase_touches, "f")[touch.id];
        }
        else {
            // First time seeing this touch, emit touchstart instead of touchmove
            if (!__classPrivateFieldGet(this, _LoupedeckDeviceBase_touches, "f")[touch.id])
                event = 'touchstart';
            __classPrivateFieldGet(this, _LoupedeckDeviceBase_touches, "f")[touch.id] = touch;
        }
        this.emit(event, { touches: Object.values(__classPrivateFieldGet(this, _LoupedeckDeviceBase_touches, "f")), changedTouches: [touch] });
    }
    async setBrightness(value) {
        const MAX_BRIGHTNESS = 10;
        const byte = Math.max(0, Math.min(MAX_BRIGHTNESS, Math.round(value * MAX_BRIGHTNESS)));
        return __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_sendAndWaitIfRequired).call(this, CommandIds.SetBrightness, Buffer.from([byte]));
    }
    async setButtonColor(...buttons) {
        if (buttons.length === 0)
            return;
        // Compile a set of the valid button ids
        const buttonIdLookup = {};
        for (const control of this.controls) {
            if (control.type === constants_1.LoupedeckControlType.Button) {
                buttonIdLookup[control.index] = control.encoded;
            }
        }
        // TODO - do we need to check for duplicates?
        const payload = Buffer.alloc(4 * buttons.length);
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            const offset = i * 4;
            const encodedId = buttonIdLookup[button.id];
            if (encodedId === undefined)
                throw new TypeError('Expected a valid button id');
            (0, util_1.checkRGBValue)(button.red);
            (0, util_1.checkRGBValue)(button.green);
            (0, util_1.checkRGBValue)(button.blue);
            payload.writeUInt8(encodedId, offset + 0);
            payload.writeUInt8(button.red, offset + 1);
            payload.writeUInt8(button.green, offset + 2);
            payload.writeUInt8(button.blue, offset + 3);
        }
        return __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_sendAndWaitIfRequired).call(this, CommandIds.SetColour, payload);
    }
    async vibrate(pattern) {
        if (!pattern)
            throw new Error('Invalid vibrate pattern');
        // TODO - validate pattern better?
        return __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_sendAndWaitIfRequired).call(this, CommandIds.SetVibration, Buffer.from([pattern]));
    }
}
exports.LoupedeckDeviceBase = LoupedeckDeviceBase;
_LoupedeckDeviceBase_touches = new WeakMap(), _LoupedeckDeviceBase_connection = new WeakMap(), _LoupedeckDeviceBase_pendingTransactions = new WeakMap(), _LoupedeckDeviceBase_nextTransactionId = new WeakMap(), _LoupedeckDeviceBase_sendQueue = new WeakMap(), _LoupedeckDeviceBase_instances = new WeakSet(), _LoupedeckDeviceBase_getDisplay = function _LoupedeckDeviceBase_getDisplay(displayId) {
    switch (displayId) {
        case constants_1.LoupedeckDisplayId.Center:
            return this.displayMain;
        case constants_1.LoupedeckDisplayId.Left:
            return this.displayLeftStrip;
        case constants_1.LoupedeckDisplayId.Right:
            return this.displayRightStrip;
        default:
            // TODO Unreachable
            return undefined;
    }
}, _LoupedeckDeviceBase_cleanupPendingPromises = function _LoupedeckDeviceBase_cleanupPendingPromises() {
    setTimeout(() => {
        for (const promise of Object.values(__classPrivateFieldGet(this, _LoupedeckDeviceBase_pendingTransactions, "f"))) {
            promise.reject(new Error('Connection closed'));
        }
    }, 0);
}, _LoupedeckDeviceBase_onMessage = function _LoupedeckDeviceBase_onMessage(buff) {
    try {
        const length = buff.readUint8(2);
        if (length + 2 !== buff.length)
            return;
        const header = buff.readUInt8(3);
        const transactionID = buff.readUInt8(4);
        if (transactionID === 0) {
            switch (header) {
                case 0x00: // Press
                    __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_onPress).call(this, buff.subarray(5));
                    break;
                case 0x01: // Rotate
                    __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_onRotate).call(this, buff.subarray(5));
                    break;
                case 0x4d: // touchmove
                    this.onTouch('touchmove', buff.subarray(5));
                    break;
                case 0x6d: // touchend
                    this.onTouch('touchend', buff.subarray(5));
                    break;
            }
        }
        else {
            const resolver = __classPrivateFieldGet(this, _LoupedeckDeviceBase_pendingTransactions, "f")[transactionID];
            if (resolver) {
                resolver.resolve(buff.subarray(5));
                delete __classPrivateFieldGet(this, _LoupedeckDeviceBase_pendingTransactions, "f")[transactionID];
            }
        }
    }
    catch (e) {
        console.error('Unhandled error in serial message handler:', e);
    }
}, _LoupedeckDeviceBase_onPress = function _LoupedeckDeviceBase_onPress(buff) {
    const controlEncoded = buff.readUint8(0);
    const control = this.controls.find((b) => b.encoded === controlEncoded);
    if (control) {
        const event = buff.readUint8(1) === 0x00 ? 'down' : 'up';
        this.emit(event, { type: control.type, index: control.index });
    }
}, _LoupedeckDeviceBase_onRotate = function _LoupedeckDeviceBase_onRotate(buff) {
    const controlEncoded = buff.readUInt8(0);
    const control = this.controls.find((b) => b.encoded === controlEncoded);
    if (control && control.type === constants_1.LoupedeckControlType.Rotary) {
        const delta = buff.readInt8(1);
        this.emit('rotate', { type: control.type, index: control.index }, delta);
    }
}, _LoupedeckDeviceBase_runInQueueIfEnabled = async function _LoupedeckDeviceBase_runInQueueIfEnabled(fn, forceSkipQueue) {
    if (__classPrivateFieldGet(this, _LoupedeckDeviceBase_sendQueue, "f") && !forceSkipQueue) {
        return __classPrivateFieldGet(this, _LoupedeckDeviceBase_sendQueue, "f").add(fn);
    }
    else {
        return fn();
    }
}, _LoupedeckDeviceBase_sendAndWaitIfRequired = async function _LoupedeckDeviceBase_sendAndWaitIfRequired(commandId, payload, skipQueue = false) {
    return __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_runInQueueIfEnabled).call(this, async () => {
        const transactionId = await __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_sendCommand).call(this, commandId, payload);
        if (!this.options.skipWaitForAcks)
            await __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_waitForTransaction).call(this, transactionId);
    }, skipQueue);
}, _LoupedeckDeviceBase_sendAndWaitForResult = async function _LoupedeckDeviceBase_sendAndWaitForResult(commandId, payload, skipQueue = false) {
    return __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_runInQueueIfEnabled).call(this, async () => {
        const transactionId = await __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_sendCommand).call(this, commandId, payload);
        return __classPrivateFieldGet(this, _LoupedeckDeviceBase_instances, "m", _LoupedeckDeviceBase_waitForTransaction).call(this, transactionId);
    }, skipQueue);
}, _LoupedeckDeviceBase_sendCommand = async function _LoupedeckDeviceBase_sendCommand(commandId, payload) {
    var _a;
    if (!__classPrivateFieldGet(this, _LoupedeckDeviceBase_connection, "f").isReady())
        throw new Error('Not connected!');
    __classPrivateFieldSet(this, _LoupedeckDeviceBase_nextTransactionId, (__classPrivateFieldGet(this, _LoupedeckDeviceBase_nextTransactionId, "f") + 1) % 256, "f");
    // Skip transaction ID's of zero since the device seems to ignore them
    if (__classPrivateFieldGet(this, _LoupedeckDeviceBase_nextTransactionId, "f") === 0)
        __classPrivateFieldSet(this, _LoupedeckDeviceBase_nextTransactionId, (_a = __classPrivateFieldGet(this, _LoupedeckDeviceBase_nextTransactionId, "f"), _a++, _a), "f");
    const packet = Buffer.alloc(3 + (payload?.length ?? 0));
    packet.writeUInt8(packet.length >= 0xff ? 0xff : packet.length, 0); // TODO - what if it is longer?
    packet.writeUInt8(commandId, 1);
    packet.writeUInt8(__classPrivateFieldGet(this, _LoupedeckDeviceBase_nextTransactionId, "f"), 2);
    if (payload && payload.length) {
        payload.copy(packet, 3);
    }
    await __classPrivateFieldGet(this, _LoupedeckDeviceBase_connection, "f").send(packet);
    return __classPrivateFieldGet(this, _LoupedeckDeviceBase_nextTransactionId, "f");
}, _LoupedeckDeviceBase_waitForTransaction = async function _LoupedeckDeviceBase_waitForTransaction(transactionID) {
    if (__classPrivateFieldGet(this, _LoupedeckDeviceBase_pendingTransactions, "f")[transactionID])
        throw new Error('Transaction handler already defined');
    if (!__classPrivateFieldGet(this, _LoupedeckDeviceBase_connection, "f").isReady())
        throw new Error('Connection is not open');
    const handler = {
        resolve: () => null,
        reject: () => null,
    };
    const promise = new Promise((resolve, reject) => {
        handler.resolve = resolve;
        handler.reject = reject;
    });
    __classPrivateFieldGet(this, _LoupedeckDeviceBase_pendingTransactions, "f")[transactionID] = handler;
    return promise;
};
//# sourceMappingURL=base.js.map

/***/ }),

/***/ 113:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEVICE_MODELS = void 0;
const constants_1 = __webpack_require__(843);
const info_1 = __webpack_require__(970);
const live_1 = __webpack_require__(158);
const razer_stream_controller_1 = __webpack_require__(348);
const live_s_1 = __webpack_require__(149);
const razer_stream_controller_x_1 = __webpack_require__(722);
/** List of all the known models, and the classes to use them */
exports.DEVICE_MODELS = [
    {
        id: info_1.LoupedeckModelId.LoupedeckLive,
        vendorId: constants_1.VendorIdLoupedeck,
        productId: 0x0004,
        class: live_1.LoupedeckLiveDevice,
    },
    {
        id: info_1.LoupedeckModelId.LoupedeckLiveS,
        vendorId: constants_1.VendorIdLoupedeck,
        productId: 0x0006,
        class: live_s_1.LoupedeckLiveSDevice,
    },
    {
        id: info_1.LoupedeckModelId.RazerStreamController,
        vendorId: constants_1.VendorIdRazer,
        productId: 0x0d06,
        class: razer_stream_controller_1.RazerStreamControllerDevice,
    },
    {
        id: info_1.LoupedeckModelId.RazerStreamControllerX,
        vendorId: constants_1.VendorIdRazer,
        productId: 0x0d09,
        class: razer_stream_controller_x_1.RazerStreamControllerDeviceX,
    },
];
//# sourceMappingURL=list.js.map

/***/ }),

/***/ 149:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LoupedeckLiveSDevice = void 0;
const constants_1 = __webpack_require__(843);
const base_1 = __webpack_require__(576);
const info_1 = __webpack_require__(970);
const DisplayCenter = {
    width: 480 - 18 * 2,
    height: 270 - 5 * 2,
    xPadding: 18,
    yPadding: 5,
    columnGap: 10,
    rowGap: 10,
};
const modelSpec = {
    controls: [],
    displayMain: DisplayCenter,
    displayLeftStrip: undefined,
    displayRightStrip: undefined,
    modelId: info_1.LoupedeckModelId.LoupedeckLiveS,
    modelName: 'Loupedeck Live S',
    lcdKeySize: 80,
    lcdKeyColumns: 5,
    lcdKeyRows: 3,
};
for (let i = 0; i < 2; i++) {
    modelSpec.controls.push({
        type: constants_1.LoupedeckControlType.Rotary,
        index: i,
        encoded: 0x01 + i,
    });
}
for (let i = 0; i < 4; i++) {
    modelSpec.controls.push({
        type: constants_1.LoupedeckControlType.Button,
        index: i,
        encoded: 0x07 + i,
    });
}
class LoupedeckLiveSDevice extends base_1.LoupedeckDeviceBase {
    constructor(connection, options) {
        super(connection, options, modelSpec);
    }
}
exports.LoupedeckLiveSDevice = LoupedeckLiveSDevice;
//# sourceMappingURL=live-s.js.map

/***/ }),

/***/ 158:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LoupedeckLiveDevice = void 0;
const constants_1 = __webpack_require__(843);
const base_1 = __webpack_require__(576);
const info_1 = __webpack_require__(970);
const DisplayLeft = {
    width: 60,
    height: 270,
    xPadding: 0,
    yPadding: 0,
    columnGap: 0,
    rowGap: 0,
};
const DisplayCenter = {
    width: 360 - 5 * 2,
    height: 270 - 5 * 2,
    xPadding: 5,
    yPadding: 5,
    columnGap: 10,
    rowGap: 10,
};
const DisplayRight = {
    width: 60,
    height: 270,
    xPadding: 0,
    yPadding: 0,
    columnGap: 0,
    rowGap: 0,
};
const modelSpec = {
    controls: [],
    displayMain: DisplayCenter,
    displayLeftStrip: DisplayLeft,
    displayRightStrip: DisplayRight,
    modelId: info_1.LoupedeckModelId.LoupedeckLive,
    modelName: 'Loupedeck Live',
    lcdKeySize: 80,
    lcdKeyColumns: 4,
    lcdKeyRows: 3,
};
for (let i = 0; i < 8; i++) {
    modelSpec.controls.push({
        type: constants_1.LoupedeckControlType.Button,
        index: i,
        encoded: 0x07 + i,
    });
}
for (let i = 0; i < 6; i++) {
    modelSpec.controls.push({
        type: constants_1.LoupedeckControlType.Rotary,
        index: i,
        encoded: 0x01 + i,
    });
}
class LoupedeckLiveDevice extends base_1.LoupedeckDeviceBase {
    constructor(connection, options) {
        super(connection, options, modelSpec);
    }
}
exports.LoupedeckLiveDevice = LoupedeckLiveDevice;
//# sourceMappingURL=live.js.map

/***/ }),

/***/ 722:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RazerStreamControllerDeviceX = void 0;
const constants_1 = __webpack_require__(843);
const base_1 = __webpack_require__(576);
const info_1 = __webpack_require__(970);
const DisplayCenter = {
    width: 480 - 5 * 2,
    height: 270,
    xPadding: 5,
    yPadding: 0,
    columnGap: 20,
    rowGap: 18,
};
const modelSpec = {
    controls: [],
    displayMain: DisplayCenter,
    displayLeftStrip: undefined,
    displayRightStrip: undefined,
    modelId: info_1.LoupedeckModelId.RazerStreamControllerX,
    modelName: 'Razer Stream Controller X',
    lcdKeySize: 78,
    lcdKeyColumns: 5,
    lcdKeyRows: 3,
};
for (let i = 0; i < 15; i++) {
    modelSpec.controls.push({
        type: constants_1.LoupedeckControlType.Button,
        index: i,
        encoded: 0x1b + i,
    });
}
class RazerStreamControllerDeviceX extends base_1.LoupedeckDeviceBase {
    constructor(connection, options) {
        super(connection, options, modelSpec);
    }
    onTouch(_event, _buff) {
        // Not supported by device
    }
}
exports.RazerStreamControllerDeviceX = RazerStreamControllerDeviceX;
//# sourceMappingURL=razer-stream-controller-x.js.map

/***/ }),

/***/ 348:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RazerStreamControllerDevice = void 0;
const constants_1 = __webpack_require__(843);
const base_1 = __webpack_require__(576);
const info_1 = __webpack_require__(970);
const DisplayLeft = {
    width: 60,
    height: 270,
    xPadding: 0,
    yPadding: 0,
    columnGap: 0,
    rowGap: 0,
};
const DisplayCenter = {
    width: 360 - 5 * 2,
    height: 270 - 5 * 2,
    xPadding: 5,
    yPadding: 5,
    columnGap: 10,
    rowGap: 10,
};
const DisplayRight = {
    width: 60,
    height: 270,
    xPadding: 0,
    yPadding: 0,
    columnGap: 0,
    rowGap: 0,
};
const modelSpec = {
    controls: [],
    displayMain: DisplayCenter,
    displayLeftStrip: DisplayLeft,
    displayRightStrip: DisplayRight,
    modelId: info_1.LoupedeckModelId.RazerStreamController,
    modelName: 'Razer Stream Controller',
    lcdKeySize: 80,
    lcdKeyColumns: 4,
    lcdKeyRows: 3,
};
for (let i = 0; i < 8; i++) {
    modelSpec.controls.push({
        type: constants_1.LoupedeckControlType.Button,
        index: i,
        encoded: 0x07 + i,
    });
}
for (let i = 0; i < 6; i++) {
    modelSpec.controls.push({
        type: constants_1.LoupedeckControlType.Rotary,
        index: i,
        encoded: 0x01 + i,
    });
}
class RazerStreamControllerDevice extends base_1.LoupedeckDeviceBase {
    constructor(connection, options) {
        super(connection, options, modelSpec);
    }
}
exports.RazerStreamControllerDevice = RazerStreamControllerDevice;
//# sourceMappingURL=razer-stream-controller.js.map

/***/ }),

/***/ 72:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LoupedeckSerialConnection = void 0;
const eventemitter3_1 = __webpack_require__(399);
class LoupedeckSerialConnection extends eventemitter3_1.EventEmitter {
}
exports.LoupedeckSerialConnection = LoupedeckSerialConnection;
//# sourceMappingURL=serial.js.map

/***/ }),

/***/ 764:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.checkRGBColor = exports.checkRGBValue = exports.encodeBuffer = exports.createCanDrawPixel = void 0;
const constants_1 = __webpack_require__(843);
function createCanDrawPixel(drawX, drawY, lcdKeySize, displayInfo) {
    const roundY = lcdKeySize + displayInfo.rowGap;
    const roundX = lcdKeySize + displayInfo.columnGap;
    const canDrawPixel = (x, y) => {
        if (displayInfo.rowGap > 0 && (drawY + y) % roundY >= lcdKeySize) {
            // Skip blanked rows
            return false;
        }
        if (displayInfo.columnGap > 0 && (drawX + x) % roundX >= lcdKeySize) {
            // Skip blanked rows
            return false;
        }
        return true;
    };
    const canDrawRow = (y) => {
        if (displayInfo.rowGap > 0 && (drawY + y) % roundY >= lcdKeySize) {
            // Skip blanked rows
            return false;
        }
        return true;
    };
    return [canDrawPixel, canDrawRow];
}
exports.createCanDrawPixel = createCanDrawPixel;
function encodeBuffer(input, output, format, outputPadding, width, height, canDrawPixel, canDrawRow) {
    const pixelCount = width * height;
    if (input.length !== pixelCount * format.length)
        throw new Error(`Incorrect buffer length ${input.length} expected ${pixelCount * format.length}`);
    if (output.length !== pixelCount * 2 + outputPadding)
        throw new Error(`Incorrect buffer length ${output.length} expected ${pixelCount * 2 + outputPadding}`);
    switch (format) {
        case constants_1.LoupedeckBufferFormat.RGB:
            for (let y = 0; y < height; y++) {
                if (!canDrawRow(y))
                    continue;
                for (let x = 0; x < width; x++) {
                    if (!canDrawPixel(x, y))
                        continue;
                    const i = y * width + x;
                    const r = input.readUInt8(i * 3 + 0) >> 3;
                    const g = input.readUInt8(i * 3 + 1) >> 2;
                    const b = input.readUInt8(i * 3 + 2) >> 3;
                    output.writeUint16LE((r << 11) + (g << 5) + b, outputPadding + i * 2);
                }
            }
            break;
        default:
            throw new Error(`Unknown BufferFormat: "${format}"`);
    }
}
exports.encodeBuffer = encodeBuffer;
function checkRGBValue(value) {
    if (value < 0 || value > 255) {
        throw new TypeError('Expected a valid color RGB value 0 - 255');
    }
}
exports.checkRGBValue = checkRGBValue;
function checkRGBColor(color) {
    checkRGBValue(color.red);
    checkRGBValue(color.green);
    checkRGBValue(color.blue);
}
exports.checkRGBColor = checkRGBColor;
//# sourceMappingURL=util.js.map

/***/ }),

/***/ 660:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.openDevice = exports.getLoupedecks = exports.requestLoupedeck = void 0;
const internal_1 = __webpack_require__(276);
const serial_1 = __webpack_require__(97);
__exportStar(__webpack_require__(613), exports);
const serialFilters = internal_1.DEVICE_MODELS.map((model) => ({
    usbProductId: model.productId,
    usbVendorId: model.vendorId,
}));
/**
 * Request the user to select some streamdecks to open
 * @param userOptions Options to customise the device behvaiour
 */
async function requestLoupedeck(options) {
    // TODO what happens if the user cancels?
    const browserDevice = await navigator.serial.requestPort({
        filters: serialFilters,
    });
    return openDevice(browserDevice, options);
}
exports.requestLoupedeck = requestLoupedeck;
/**
 * Reopen previously selected streamdecks.
 * The browser remembers what the user previously allowed your site to access, and this will open those without the request dialog
 * @param options Options to customise the device behvaiour
 */
async function getLoupedecks(options) {
    const browserDevices = await navigator.serial.getPorts();
    if (browserDevices.length === 0) {
        return [];
    }
    const validIds = new Set();
    for (const model of internal_1.DEVICE_MODELS) {
        validIds.add(`${model.vendorId}-${model.productId}`);
    }
    const validDevices = browserDevices.filter((dev) => {
        const portInfo = dev.getInfo();
        return validIds.has(`${portInfo.usbVendorId}-${portInfo.usbProductId}`);
    });
    const resultDevices = await Promise.all(validDevices.map(async (dev) => openDevice(dev, options).catch((_) => null)) // Ignore failures
    );
    return resultDevices.filter((v) => !!v);
}
exports.getLoupedecks = getLoupedecks;
/**
 * Open a StreamDeck from a manually selected HIDDevice handle
 * @param browserPort The unopened browser HIDDevice
 * @param userOptions Options to customise the device behvaiour
 */
async function openDevice(browserPort, userOptions) {
    const portInfo = browserPort.getInfo();
    const model = internal_1.DEVICE_MODELS.find((m) => m.productId === portInfo.usbProductId && m.vendorId === portInfo.usbVendorId);
    if (!model) {
        throw new Error('Stream Deck is of unexpected type.');
    }
    const serialPort = await serial_1.LoupedeckWebSerialConnection.open(browserPort);
    // await browserDevice.open()
    const options = userOptions ?? {};
    const device = new model.class(serialPort, options || {});
    // return new StreamDeckWeb(device)
    return device;
}
exports.openDevice = openDevice;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 97:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var Buffer = __webpack_require__(291)["lW"];

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LoupedeckWebSerialConnection = void 0;
const core_1 = __webpack_require__(613);
const internal_1 = __webpack_require__(276);
class LoupedeckWebSerialConnection extends core_1.LoupedeckSerialConnection {
    constructor(connection, reader, writer) {
        super();
        this.connection = connection;
        this.reader = reader;
        this.writer = writer;
        this.isOpen = true;
        this.connection.addEventListener('error', (err) => {
            this.emit('error', err); // TODO
        });
        this.connection.addEventListener('connect', () => {
            console.log('connect');
            this.isOpen = true;
            // TODO - will this ever fire in a usable way?
            try {
                this.openReaderWriter();
            }
            catch (err) {
                this.emit('error', err); // TODO
            }
        });
        this.connection.addEventListener('disconnect', () => {
            console.log('disconnect');
            this.isOpen = false;
            this.closeReaderWriter();
            this.emit('disconnect');
        });
        this.startReadLoop(this.reader);
    }
    startReadLoop(reader) {
        Promise.resolve()
            .then(async () => {
            const parser = new PacketLengthParser({
                delimiter: 0x82,
            });
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const { value, done } = await reader.read();
                if (value) {
                    const chunks = parser.transform(Buffer.from(value));
                    for (const chunk of chunks) {
                        this.emit('message', chunk);
                    }
                }
                if (done) {
                    // Allow the serial port to be closed later.
                    reader.releaseLock();
                    break;
                }
            }
        })
            .catch((e) => {
            this.emit('error', e);
        });
    }
    closeReaderWriter() {
        if (this.writer) {
            this.writer.close().catch(() => null);
            delete this.writer;
        }
    }
    openReaderWriter() {
        this.closeReaderWriter();
        if (!this.connection)
            throw new Error('SerialPort is closed');
        if (!this.connection.writable)
            throw new Error('SerialPort is not writable');
        if (!this.connection.readable)
            throw new Error('SerialPort is not readable');
        this.writer = this.connection.writable.getWriter();
        this.reader = this.connection.readable.getReader();
        this.startReadLoop(this.reader);
    }
    static async open(connection) {
        let reader;
        let writer;
        try {
            await connection.open({
                baudRate: 256000,
            });
            if (!connection.writable)
                throw new Error('SerialPort is not writable');
            if (!connection.readable)
                throw new Error('SerialPort is not readable');
            writer = connection.writable.getWriter();
            reader = connection.readable.getReader();
            // Sometimes the first write gets lost
            let readComplete = false;
            const writer2 = writer;
            const [firstRead] = await Promise.all([
                reader.read().then((res) => {
                    // Inform the write loop to sto
                    readComplete = true;
                    return res;
                }),
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        // Catchall timeout to abort if it doesn't complete in time
                        reject(new Error('Timed out'));
                    }, 5000);
                    const tick = () => {
                        if (readComplete) {
                            // Read has finished. Stop repeating the write
                            resolve();
                        }
                        else {
                            // Try writing again
                            writer2
                                .write(internal_1.WS_UPGRADE_HEADER)
                                .then(() => {
                                // Run again
                                setTimeout(tick, 10);
                            })
                                .catch((e) => {
                                reject(e);
                            });
                        }
                    };
                    tick();
                }),
            ]).catch((e) => {
                // If the read failed, stop the write from contuing
                readComplete = true;
                // If the write failed, abort the read
                reader?.cancel('Aborted').catch(() => null);
                // Forward the error onwards
                throw e;
            });
            if (!firstRead.value)
                throw new Error(`No handshake response`);
            const responseBuffer = Buffer.from(firstRead.value);
            if (!responseBuffer.toString().startsWith(internal_1.WS_UPGRADE_RESPONSE))
                throw new Error(`Invalid handshake response: ${responseBuffer.toString()}`);
            return new LoupedeckWebSerialConnection(connection, reader, writer);
        }
        catch (err) {
            // cleanup any in-progress connection
            connection.close().catch(() => null);
            reader?.cancel('Aborted')?.catch(() => null);
            writer?.abort('Aborted')?.catch(() => null);
            throw err;
        }
    }
    async close() {
        if (this.writer) {
            this.writer.close().catch(() => null); // Ignore error
            delete this.writer;
        }
        if (this.connection) {
            await this.connection.close().catch(() => null); // Ignore error
            delete this.connection;
        }
    }
    isReady() {
        return this.connection !== undefined && this.isOpen;
    }
    async send(buff, raw = false) {
        if (!this.connection || !this.writer)
            throw new Error('Not connected!');
        if (!raw) {
            let prep;
            // Large messages
            if (buff.length > 0xff) {
                prep = Buffer.alloc(14);
                prep.writeUint8(0x82, 0);
                prep.writeUint8(0xff, 1);
                prep.writeUInt32BE(buff.length, 6);
            }
            // Small messages
            else {
                // Prepend each message with a send indicating the length to come
                prep = Buffer.alloc(6);
                prep.writeUint8(0x82, 0);
                prep.writeUint8(0x80 + buff.length, 1); // TODO - is this correct, or should it switch to large mode sooner?
            }
            await this.writer.write(prep);
        }
        await this.writer.write(buff);
    }
}
exports.LoupedeckWebSerialConnection = LoupedeckWebSerialConnection;
class PacketLengthParser {
    constructor(options = {}) {
        this.buffer = Buffer.alloc(0);
        this.start = true;
        const { delimiter = 0xaa, packetOverhead = 2, lengthBytes = 1, lengthOffset = 1, maxLen = 0xff } = options;
        this.opts = {
            delimiter,
            packetOverhead,
            lengthBytes,
            lengthOffset,
            maxLen,
        };
    }
    transform(chunk) {
        const chunks = [];
        // TODO - this is really really inefficient...
        for (let ndx = 0; ndx < chunk.length; ndx++) {
            const byte = chunk[ndx];
            if (byte === this.opts.delimiter) {
                this.start = true;
            }
            if (true === this.start) {
                this.buffer = Buffer.concat([this.buffer, Buffer.from([byte])]);
                if (this.buffer.length >= this.opts.lengthOffset + this.opts.lengthBytes) {
                    const len = this.buffer.readUIntLE(this.opts.lengthOffset, this.opts.lengthBytes);
                    if (this.buffer.length == len + this.opts.packetOverhead || len > this.opts.maxLen) {
                        chunks.push(this.buffer);
                        this.buffer = Buffer.alloc(0);
                        this.start = false;
                    }
                }
            }
        }
        return chunks;
    }
}
//# sourceMappingURL=serial.js.map

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const web_1 = __webpack_require__(660);
// import { DomImageDemo } from './demo/dom'
const fill_when_pressed_1 = __webpack_require__(306);
const rapid_fill_1 = __webpack_require__(283);
if (true) {
    const elm = document.querySelector('#version_str');
    if (elm) {
        elm.innerHTML = `v${"0.4.0"}`;
    }
}
function appendLog(str) {
    const logElm = document.getElementById('log');
    if (logElm) {
        logElm.textContent = `${str}\n${logElm.textContent ?? ''}`;
    }
}
const demoSelect = document.getElementById('demo-select');
const consentButton = document.getElementById('consent-button');
let device = null;
let currentDemo = new fill_when_pressed_1.FillWhenPressedDemo();
async function demoChange() {
    if (demoSelect) {
        console.log(`Selected demo: ${demoSelect.value}`);
        if (device) {
            await currentDemo.stop(device);
        }
        switch (demoSelect.value) {
            case 'rapid-fill':
                currentDemo = new rapid_fill_1.RapidFillDemo();
                break;
            // 	case 'dom':
            // 		currentDemo = new DomImageDemo()
            // 		break
            // 	case 'chase':
            // 		currentDemo = new ChaseDemo()
            // 		break
            case 'fill-when-pressed':
            default:
                currentDemo = new fill_when_pressed_1.FillWhenPressedDemo();
                break;
        }
        if (device) {
            await currentDemo.start(device);
        }
    }
}
async function openDevice(device) {
    appendLog(`Device opened`);
    appendLog(`Serial: ${await device.getSerialNumber()} Firmware: ${await device.getFirmwareVersion()}`);
    device.on('error', (err) => {
        appendLog(`Error: ${err}`);
    });
    device.on('down', (info) => {
        appendLog(`${info.type}-${info.index} down`);
        currentDemo.controlDown(device, info).catch(console.error);
    });
    device.on('up', (info) => {
        appendLog(`${info.type}-${info.index} up`);
        currentDemo.controlUp(device, info).catch(console.error);
    });
    device.on('rotate', (info, delta) => {
        appendLog(`${info.type}-${info.index} rotate ${delta}`);
        currentDemo.controlRotate(device, info, delta).catch(console.error);
    });
    device.on('touchstart', (evt) => {
        appendLog(`Touch start ${JSON.stringify(evt)}`);
        currentDemo.touchStart(device, evt).catch(console.error);
    });
    device.on('touchmove', (evt) => {
        appendLog(`Touch move ${JSON.stringify(evt)}`);
        currentDemo.touchMove(device, evt).catch(console.error);
    });
    device.on('touchend', (evt) => {
        appendLog(`Touch end ${JSON.stringify(evt)}`);
        currentDemo.touchEnd(device, evt).catch(console.error);
    });
    await currentDemo.start(device);
    // Sample actions
    await device.setBrightness(70);
    // device.fillColor(2, 255, 0, 0)
    // device.fillColor(12, 0, 0, 255)
}
if (consentButton) {
    const doLoad = async () => {
        // attempt to open a previously selected device.
        const devices = await (0, web_1.getLoupedecks)();
        if (devices.length > 0) {
            device = devices[0];
            openDevice(device).catch(console.error);
        }
        console.log(devices);
    };
    window.addEventListener('load', () => {
        doLoad().catch((e) => console.error(e));
    });
    const brightnessRange = document.getElementById('brightness-range');
    if (brightnessRange) {
        brightnessRange.addEventListener('input', (_e) => {
            const value = brightnessRange.value;
            if (device) {
                device.setBrightness(value / 100).catch(console.error);
            }
        });
    }
    if (demoSelect) {
        demoSelect.addEventListener('input', () => {
            demoChange().catch(console.error);
        });
        demoChange().catch(console.error);
    }
    const consentClick = async () => {
        if (device) {
            appendLog('Closing device');
            currentDemo.stop(device).catch(console.error);
            await device.close();
            device = null;
        }
        // Prompt for a device
        try {
            device = await (0, web_1.requestLoupedeck)();
        }
        catch (error) {
            appendLog(`No device access granted: ${error}`);
            return;
        }
        openDevice(device).catch(console.error);
    };
    consentButton.addEventListener('click', () => {
        consentClick().catch((e) => console.error(e));
    });
    appendLog('Page loaded');
}

})();

/******/ })()
;
//# sourceMappingURL=main.map