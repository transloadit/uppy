import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'

export interface ScreenCaptureOptions extends PluginOptions {
    target?: PluginTarget
    displayMediaConstraints?: DisplayMediaStreamConstraints,
    userMediaConstraints?: MediaStreamConstraints,
    preferredVideoMimeType?: string
  }

declare class ScreenCapture extends UIPlugin<ScreenCaptureOptions> {}

export default ScreenCapture
