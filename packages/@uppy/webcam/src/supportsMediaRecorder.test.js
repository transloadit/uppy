/* eslint-disable max-classes-per-file, class-methods-use-this */
import { describe, expect, it } from '@jest/globals'
import supportsMediaRecorder from './supportsMediaRecorder.js'

describe('supportsMediaRecorder', () => {
  it('should return true if MediaRecorder is supported', () => {
    globalThis.MediaRecorder = class MediaRecorder {
      start () {}
    }
    expect(supportsMediaRecorder()).toEqual(true)
  })

  it('should return false if MediaRecorder is not supported', () => {
    globalThis.MediaRecorder = undefined
    expect(supportsMediaRecorder()).toEqual(false)

    globalThis.MediaRecorder = class MediaRecorder {}
    expect(supportsMediaRecorder()).toEqual(false)

    globalThis.MediaRecorder = class MediaRecorder {
      foo () {}
    }
    expect(supportsMediaRecorder()).toEqual(false)
  })
})
