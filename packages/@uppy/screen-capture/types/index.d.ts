import Uppy = require('@uppy/core');

declare module ScreenCapture {
  interface DisplayMediaStreamConstraints {
    audio?: boolean | MediaTrackConstraints;
    video?: boolean | (MediaTrackConstraints & {
      cursor?: 'always' | 'motion' | 'never',
      displaySurface?: 'application' | 'browser' | 'monitor' | 'window',
      logicalSurface?: boolean
    });
  }

  export interface ScreenCaptureOptions extends Uppy.PluginOptions {
    displayMediaConstraints?: DisplayMediaStreamConstraints,
    userMediaConstraints?: MediaStreamConstraints,
    preferredVideoMimeType?: string
  }
}

declare class ScreenCapture extends Uppy.Plugin<ScreenCapture.ScreenCaptureOptions> {}

export = ScreenCapture;
