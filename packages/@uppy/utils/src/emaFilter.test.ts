import { describe, expect, it } from 'vitest'
import emaFilter from './emaFilter.js'

describe('emaFilter', () => {
  it('should calculate the exponential average', () => {
    expect(emaFilter(1, 0, 0, 1)).toBe(1)

    expect(emaFilter(1, 0, 2, 0)).toBe(0)
    expect(emaFilter(1, 0, 2, 2)).toBeCloseTo(0.5)
    expect(emaFilter(1, 0, 2, 4)).toBeCloseTo(0.75)
    expect(emaFilter(1, 0, 2, 6)).toBeCloseTo(0.875)

    expect(emaFilter(0, 1, 2, 2)).toBeCloseTo(0.5)
    expect(emaFilter(0, 1, 2, 4)).toBeCloseTo(0.25)
    expect(emaFilter(0, 1, 2, 6)).toBeCloseTo(0.125)

    expect(emaFilter(0.5, 1, 2, 4)).toBeCloseTo(0.625)
    expect(emaFilter(1, 0.5, 2, 4)).toBeCloseTo(0.875)
  })
  it('should behave like exponential moving average', () => {
    const firstValue = 1
    const newValue = 10
    const step = 0.618033989
    const halfLife = 2
    let lastFilteredValue = firstValue
    for (let i = 0; i < 10; ++i) {
      lastFilteredValue = emaFilter(newValue, lastFilteredValue, halfLife, step)
      expect(lastFilteredValue).toBeCloseTo(
        emaFilter(newValue, firstValue, halfLife, step * (i + 1)),
      )
    }
  })
})
