import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module Webcam {

    export type WebcamMode = 'video-audio' | 'video-only' | 'audio-only' | 'picture';

    export interface WebcamOptions extends PluginOptions {
        onBeforeSnapshot?: () => Promise<void>;
        countdown?: number | boolean;
        mirror?: boolean;
        facingMode?: string;
        modes: WebcamMode[];
    }
}

declare class Webcam extends Plugin {
    constructor(uppy: Uppy, opts: Partial<Webcam.WebcamOptions>);
}

export = Webcam;

declare module '@uppy/core' {
    export interface Uppy {
        use(pluginClass: typeof Webcam, opts: Partial<Webcam.WebcamOptions>): Uppy;
    }
}
