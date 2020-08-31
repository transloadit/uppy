import Uppy = require('@uppy/core')
import WebcamLocale = require('./generatedLocale')

declare module Webcam {
  export type WebcamMode =
    | 'video-audio'
    | 'video-only'
    | 'audio-only'
    | 'picture'

  export interface WebcamOptions extends Uppy.PluginOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    onBeforeSnapshot?: () => Promise<void>
    countdown?: number | boolean
    mirror?: boolean
    facingMode?: string
    showVideoSourceDropdown?: boolean
    modes?: WebcamMode[]
    locale?: WebcamLocale
    title?: string
    videoConstraints?: MediaTrackConstraints
  }
}

declare class Webcam extends Uppy.Plugin<Webcam.WebcamOptions> {}

export = Webcam
