import { describe, expect, it } from '@jest/globals'
import getETA from './getETA.js'

describe('getETA', () => {
  it('should get the ETA remaining based on a fileProgress object', () => {
    const dateNow = new Date()
    const date5SecondsAgo = new Date(dateNow.getTime() - 5 * 1000)
    const fileProgress = {
      bytesUploaded: 1024,
      bytesTotal: 3096,
      uploadStarted: date5SecondsAgo,
    }
    expect(getETA(fileProgress)).toEqual(10.1)
  })
})
