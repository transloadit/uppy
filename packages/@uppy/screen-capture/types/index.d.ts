import Uppy = require('@uppy/core');

declare module ScreenCapture {
  // https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints#Properties_of_shared_screen_tracks
  // TODO: use the global DisplayMediaStreamConstraints once typescript includes it by default
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
