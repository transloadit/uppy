import { expectError } from 'tsd'
import Uppy from '@uppy/core'
import ScreenCapture from '..'

new Uppy().use(ScreenCapture)
new Uppy().use(ScreenCapture, {})
new Uppy().use(ScreenCapture, { preferredVideoMimeType: 'video/mp4' })
expectError(new Uppy().use(ScreenCapture, { preferredVideoMimeType: 10 }))

new Uppy().use(ScreenCapture, {
  displayMediaConstraints: {
    video: { displaySurface: 'window' },
  },
})
expectError(
  new Uppy().use(ScreenCapture, {
    displayMediaConstraints: {
      video: { displaySurface: 'some nonsense' },
    },
  }),
)
