/* eslint-disable max-classes-per-file, compat/compat */
import { describe, expect, it } from 'vitest'
import supportsMediaRecorder from './supportsMediaRecorder.ts'

describe('supportsMediaRecorder', () => {
  it('should return true if MediaRecorder is supported', () => {
    // @ts-expect-error just a test
    globalThis.MediaRecorder = class MediaRecorder {
      start() {} // eslint-disable-line
    }
    expect(supportsMediaRecorder()).toEqual(true)
  })

  it('should return false if MediaRecorder is not supported', () => {
    // @ts-expect-error just a test
    globalThis.MediaRecorder = undefined
    expect(supportsMediaRecorder()).toEqual(false)

    // @ts-expect-error just a test
    globalThis.MediaRecorder = class MediaRecorder {}
    expect(supportsMediaRecorder()).toEqual(false)

    // @ts-expect-error just a test
    globalThis.MediaRecorder = class MediaRecorder {
      foo() {} // eslint-disable-line
    }
    expect(supportsMediaRecorder()).toEqual(false)
  })
})
