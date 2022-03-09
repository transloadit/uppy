/* eslint-disable max-classes-per-file */
import supportsMediaRecorder from './supportsMediaRecorder.js'

describe('supportsMediaRecorder', () => {
  it('should return true if MediaRecorder is supported', () => {
    global.MediaRecorder = class MediaRecorder {
      start () {} // eslint-disable-line
    }
    expect(supportsMediaRecorder()).toEqual(true)
  })

  it('should return false if MediaRecorder is not supported', () => {
    global.MediaRecorder = undefined
    expect(supportsMediaRecorder()).toEqual(false)

    global.MediaRecorder = class MediaRecorder {}
    expect(supportsMediaRecorder()).toEqual(false)

    global.MediaRecorder = class MediaRecorder {
      foo () {} // eslint-disable-line
    }
    expect(supportsMediaRecorder()).toEqual(false)
  })
})
