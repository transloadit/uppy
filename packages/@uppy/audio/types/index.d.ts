import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'
import AudioLocale from './generatedLocale'

export interface AudioOptions extends PluginOptions {
    target?: PluginTarget
    showVideoSourceDropdown?: boolean
    locale?: AudioLocale
}

declare class Audio extends UIPlugin<AudioOptions> {}

export default Audio
