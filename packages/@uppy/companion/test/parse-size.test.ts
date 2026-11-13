import { expect, test } from 'vitest'
import { parseSize } from '../src/server/helpers/utils.js'

test.each([
  [123, 123],
  ['456', 456],
  [undefined, undefined],
  ['', undefined],
  [null, undefined],
  [Number.NaN, undefined],
])('parseSize(%j) is %j', (value, expected) => {
  expect(parseSize(value)).toBe(expected)
})
