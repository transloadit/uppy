import Uppy = require('@uppy/core')

declare module Webcam {
  export type WebcamMode =
    | 'video-audio'
    | 'video-only'
    | 'audio-only'
    | 'picture'

  export interface WebcamOptions extends Uppy.PluginOptions {
    target?: Uppy.PluginTarget
    onBeforeSnapshot?: () => Promise<void>
    countdown?: number | boolean
    mirror?: boolean
    facingMode?: string
    modes?: WebcamMode[]
  }
}

declare class Webcam extends Uppy.Plugin<Webcam.WebcamOptions> {}

export = Webcam
