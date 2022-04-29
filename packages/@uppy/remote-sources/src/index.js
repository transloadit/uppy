import { BasePlugin } from '@uppy/core'
import Dropbox from '@uppy/dropbox'
import GoogleDrive from '@uppy/google-drive'
import Instagram from '@uppy/instagram'
import Facebook from '@uppy/facebook'
import OneDrive from '@uppy/onedrive'
import Box from '@uppy/box'
import Unsplash from '@uppy/unsplash'
import Url from '@uppy/url'
import Zoom from '@uppy/zoom'

const remoteSourcesPluginList = [
  Dropbox,
  GoogleDrive,
  Instagram,
  Facebook,
  OneDrive,
  Box,
  Unsplash,
  Url,
  Zoom,
]

export default class RemoteSources extends BasePlugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'RemoteSources'
    this.type = 'modifier'

    this.opts = { ...opts }
  }

  install () {
    remoteSourcesPluginList.forEach((plugin) => {
      this.uppy.use(plugin, { companionUrl: this.opts.companionUrl })
    })
  }

  uninstall () {
    remoteSourcesPluginList.forEach((plugin) => {
      this.uppy.removePlugin(this.uppy.getPlugin(plugin.name))
    })
  }
}
