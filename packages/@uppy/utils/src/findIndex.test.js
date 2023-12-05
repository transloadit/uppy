import { describe, expect, it } from 'vitest'
import findIndex from './findIndex.js'

describe('findIndex', () => {
  it('should return index of an object in an array, that matches a predicate', () => {
    const arr = [{ name: 'foo' }, { name: 'bar' }, { name: '123' }]
    const index = findIndex(arr, (item) => item.name === 'bar')
    expect(index).toEqual(1)
  })

  it('should return -1 when no object in an array matches a predicate', () => {
    const arr = [{ name: 'foo' }, { name: 'bar' }, { name: '123' }]
    const index = findIndex(arr, (item) => item.name === 'hello')
    expect(index).toEqual(-1)
  })
})
