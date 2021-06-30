import { expectError } from 'tsd'
import Uppy = require('@uppy/core')
import ScreenCapture = require('../')

{
  Uppy().use(ScreenCapture)
  Uppy().use(ScreenCapture, {})
  Uppy().use(ScreenCapture, { preferredVideoMimeType: 'video/mp4' })
  expectError(Uppy().use(ScreenCapture, { preferredVideoMimeType: 10 }))
}

{
  Uppy().use(ScreenCapture, {
    displayMediaConstraints: {
      video: { displaySurface: 'window' }
    }
  })
  expectError(Uppy().use(ScreenCapture, {
    displayMediaConstraints: {
      video: { displaySurface: 'some nonsense' }
    }
  }))
}
