import { describe, expect, it } from 'vitest'
import supportsMediaRecorder from './supportsMediaRecorder.js'

describe('supportsMediaRecorder', () => {
  it('should return true if MediaRecorder is supported', () => {
    // @ts-ignore
    globalThis.MediaRecorder = class MediaRecorder {
      start() {}
    }
    expect(supportsMediaRecorder()).toEqual(true)
  })

  it('should return false if MediaRecorder is not supported', () => {
    // @ts-ignore
    globalThis.MediaRecorder = undefined
    expect(supportsMediaRecorder()).toEqual(false)

    // @ts-ignore
    globalThis.MediaRecorder = class MediaRecorder {}
    expect(supportsMediaRecorder()).toEqual(false)

    // @ts-ignore
    globalThis.MediaRecorder = class MediaRecorder {
      foo() {}
    }
    expect(supportsMediaRecorder()).toEqual(false)
  })
})
