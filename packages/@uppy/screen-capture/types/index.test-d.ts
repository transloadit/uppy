import { expectError } from 'tsd'
import Uppy = require('@uppy/core')
import ScreenCapture = require('../')

Uppy<Uppy.StrictTypes>().use(ScreenCapture)
Uppy<Uppy.StrictTypes>().use(ScreenCapture, {})
Uppy<Uppy.StrictTypes>().use(ScreenCapture, { preferredVideoMimeType: 'video/mp4' })
expectError(Uppy<Uppy.StrictTypes>().use(ScreenCapture, { preferredVideoMimeType: 10 }))

function constraints () {
  Uppy<Uppy.StrictTypes>().use(ScreenCapture, {
    displayMediaConstraints: {
      video: { displaySurface: 'window' }
    }
  })
  expectError(Uppy<Uppy.StrictTypes>().use(ScreenCapture, {
    displayMediaConstraints: {
      video: { displaySurface: 'some nonsense' }
    }
  }))
}
