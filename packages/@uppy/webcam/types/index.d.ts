import { Plugin, PluginOptions, Uppy } from '@uppy/core';

export interface WebcamOptions extends PluginOptions {
  onBeforeSnapshot?: () => Promise<void>;
  countdown?: number | boolean;
  mirror?: boolean;
  facingMode?: string;
  modes: Array<'video-audio' | 'video-only' | 'audio-only' | 'picturee'>;
}

export default class Webcam extends Plugin {
  constructor(uppy: Uppy, opts: Partial<WebcamOptions>);
}
