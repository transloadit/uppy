import { expectError } from 'tsd'
import Uppy from '@uppy/core'
import Webcam from '..'

new Uppy().use(Webcam, {
  modes: ['video-only'],
})

new Uppy().use(Webcam, {
  modes: ['video-only'],
  videoConstraints: {
    width: { min: 420, ideal: 420, max: 1920 },
    height: { min: 420, ideal: 420, max: 1080 },
  },
})

expectError(
  new Uppy().use(Webcam, {
    modes: ['video-only'],
    videoConstraints: {
      width: 'not a number har har',
    },
  }),
)
