import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'
import WebcamLocale from './generatedLocale'

export type WebcamMode =
    | 'video-audio'
    | 'video-only'
    | 'audio-only'
    | 'picture'

export interface WebcamOptions extends PluginOptions {
    target?: PluginTarget
    onBeforeSnapshot?: () => Promise<void>
    countdown?: number | boolean
    mirror?: boolean
    /**
     * @deprecated Use `videoConstraints.facingMode` instead.
     */
    facingMode?: string
    showVideoSourceDropdown?: boolean
    modes?: WebcamMode[]
    locale?: WebcamLocale
    title?: string
    videoConstraints?: MediaTrackConstraints
    showRecordingLength?: boolean
    preferredImageMimeType?: string
    preferredVideoMimeType?: string
    mobileNativeCamera?: boolean
}

declare class Webcam extends UIPlugin<WebcamOptions> {}

export default Webcam
