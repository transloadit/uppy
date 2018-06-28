import { Plugin, PluginOptions, Uppy } from '@uppy/core';

export type WebcamMode = 'video-audio' | 'video-only' | 'audio-only' | 'picture';

export interface WebcamOptions extends PluginOptions {
  onBeforeSnapshot?: () => Promise<void>;
  countdown?: number | boolean;
  mirror?: boolean;
  facingMode?: string;
  modes: WebcamMode[];
}

export default class Webcam extends Plugin {
  constructor(uppy: Uppy, opts: Partial<WebcamOptions>);
}

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Webcam, opts: Partial<WebcamOptions>): Uppy;
  }
}
