import Uppy = require('@uppy/core')

declare module Webcam {
  export type WebcamMode =
    | 'video-audio'
    | 'video-only'
    | 'audio-only'
    | 'picture'

  export type WebcamLocale = Uppy.Locale<
    | 'smile'
    | 'takePicture'
    | 'startRecording'
    | 'stopRecording'
    | 'allowAccessTitle'
    | 'allowAccessDescription'
    | 'recordingLength'
  >

  export interface WebcamOptions extends Uppy.PluginOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    onBeforeSnapshot?: () => Promise<void>
    countdown?: number | boolean
    mirror?: boolean
    facingMode?: string
    modes?: WebcamMode[]
    locale?: WebcamLocale
  }
}

declare class Webcam extends Uppy.Plugin<Webcam.WebcamOptions> {}

export = Webcam
