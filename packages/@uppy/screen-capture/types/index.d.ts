import type { PluginTarget, UIPlugin, UIPluginOptions } from '@uppy/core'

// https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints#Properties_of_shared_screen_tracks
// TODO: use the global DisplayMediaStreamConstraints once typescript includes it by default
interface DisplayMediaStreamConstraints {
  audio?: boolean | MediaTrackConstraints
  video?:
    | boolean
    | (MediaTrackConstraints & {
        cursor?: 'always' | 'motion' | 'never'
        displaySurface?: 'application' | 'browser' | 'monitor' | 'window'
        logicalSurface?: boolean
      })
}

export interface ScreenCaptureOptions extends UIPluginOptions {
  target?: PluginTarget
  displayMediaConstraints?: DisplayMediaStreamConstraints
  userMediaConstraints?: MediaStreamConstraints
  preferredVideoMimeType?: string
}

declare class ScreenCapture extends UIPlugin<ScreenCaptureOptions> {}

export default ScreenCapture
