/* eslint-disable max-classes-per-file, class-methods-use-this, @typescript-eslint/ban-ts-comment */
import { describe, expect, it } from 'vitest'
import supportsMediaRecorder from './supportsMediaRecorder.ts'

describe('supportsMediaRecorder', () => {
  it('should return true if MediaRecorder is supported', () => {
    // @ts-ignore
    globalThis.MediaRecorder = class MediaRecorder {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
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
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      foo() {}
    }
    expect(supportsMediaRecorder()).toEqual(false)
  })
})
