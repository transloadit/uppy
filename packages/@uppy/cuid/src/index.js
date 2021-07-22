'use strict'

/* global BigUint64Array */

const
  blockSize = 4,
  base = 36,
  discreteValues = base ** blockSize

function* generateNextCounter () {
  while (true) {
    for (let i = 0; i < discreteValues; i++) {
      yield i.toString(base).padStart(blockSize, '0')
    }
  }
}

const randomBase36String = (minSize) => {
  const b = new Uint16Array(4)
  crypto.getRandomValues(b)
  return new BigUint64Array(b.buffer)[0].toString(base).padStart(minSize, '0')
}

const safeCounter = generateNextCounter()
module.exports = function cuid () {
  return `c${Date.now().toString(base)}${safeCounter.next().value}${randomBase36String(blockSize * 3)}`
}
