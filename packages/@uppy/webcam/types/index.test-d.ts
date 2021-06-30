import { expectError } from 'tsd'
import Uppy = require('@uppy/core')
import Webcam = require('../')

{
  Uppy().use(Webcam, {
    modes: ['video-only']
  })
}

{
  Uppy().use(Webcam, {
    modes: ['video-only'],
    videoConstraints: {
      width: { min: 420, ideal: 420, max: 1920 },
      height: { min: 420, ideal: 420, max: 1080 }
    }
  })
}

{
  expectError(Uppy().use(Webcam, {
    modes: ['video-only'],
    videoConstraints: {
      width: 'not a number har har'
    }
  }))
}
