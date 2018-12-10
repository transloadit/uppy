import Uppy = require('@uppy/core');

declare module Webcam {
  export type WebcamMode = 'video-audio' | 'video-only' | 'audio-only' | 'picture';

  export interface WebcamOptions extends Uppy.PluginOptions {
    onBeforeSnapshot?: () => Promise<void>;
    countdown?: number | boolean;
    mirror?: boolean;
    facingMode?: string;
    modes: WebcamMode[];
  }
}

declare class Webcam extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<Webcam.WebcamOptions>);
}

export = Webcam;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Webcam, opts: Partial<Webcam.WebcamOptions>): Uppy.Uppy;
  }
}
