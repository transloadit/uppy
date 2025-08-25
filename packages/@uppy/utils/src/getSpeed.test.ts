import { describe, expect, it } from 'vitest'
import getSpeed from './getSpeed.js'

describe('getSpeed', () => {
  it('should calculate the speed given a fileProgress object', () => {
    const dateNow = new Date()
    const date5SecondsAgo = new Date(dateNow.getTime() - 5 * 1000)
    const fileProgress = {
      bytesUploaded: 1024,
      uploadStarted: date5SecondsAgo.getTime(),
      progress: 0,
      uploadComplete: false,
      percentage: 0,
      bytesTotal: 0,
    }
    expect(Math.round(getSpeed(fileProgress))).toEqual(Math.round(205))
  })
})
