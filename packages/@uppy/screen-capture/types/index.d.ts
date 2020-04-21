import Uppy = require('@uppy/core');

declare module ScreenCapture {

  export interface ScreenCaptureOptions extends Uppy.PluginOptions {
    displayMediaConstraints: {
      audio: boolean,
      video: { 
        width: number, 
        height: number,
        frameRate: { 
          ideal: number, 
          max: number } 
        }
    },
    preferredVideoMimeType: string
  }
}

declare class ScreenCapture extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<ScreenCapture.ScreenCaptureOptions>);
}

export = ScreenCapture;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof ScreenCapture, opts: Partial<ScreenCapture.ScreenCaptureOptions>): Uppy.Uppy;
  }
}
