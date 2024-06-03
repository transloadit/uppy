import type { PluginTarget, UIPlugin, UIPluginOptions } from '@uppy/core'
import type AudioLocale from './generatedLocale.js'

export interface AudioOptions extends UIPluginOptions {
  target?: PluginTarget
  showAudioSourceDropdown?: boolean
  locale?: AudioLocale
}

declare class Audio extends UIPlugin<AudioOptions> {}

export default Audio
