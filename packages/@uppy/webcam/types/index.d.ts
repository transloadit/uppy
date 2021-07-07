import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'
import WebcamLocale from './generatedLocale'

declare module Webcam {
  export type WebcamMode =
    | 'video-audio'
    | 'video-only'
    | 'audio-only'
    | 'picture'

  export interface WebcamOptions extends PluginOptions {
    replaceTargetContent?: boolean
    target?: PluginTarget
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

declare class Webcam extends UIPlugin<Webcam.WebcamOptions> {}

export default Webcam
