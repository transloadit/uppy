import { BasePlugin } from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Dropbox from '@uppy/dropbox'
import GoogleDrive from '@uppy/google-drive'
import Instagram from '@uppy/instagram'
import Facebook from '@uppy/facebook'
import OneDrive from '@uppy/onedrive'
import Box from '@uppy/box'
import Unsplash from '@uppy/unsplash'
import Url from '@uppy/url'
import Zoom from '@uppy/zoom'

import packageJson from '../package.json'

const availablePlugins = [
  Box,
  Dropbox,
  Facebook,
  GoogleDrive,
  Instagram,
  OneDrive,
  Unsplash,
  Url,
  Zoom,
]

export default class RemoteSources extends BasePlugin {
  static VERSION = packageJson.version

  #installedPlugins = new Set()

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'RemoteSources'
    this.type = 'acquirer'

    const defaultOptions = {
      sources: [
        'Box',
        'Dropbox',
        'Facebook',
        'GoogleDrive',
        'Instagram',
        'OneDrive',
        'Unsplash',
        'Url',
      ],
      target: Dashboard,
    }
    this.opts = { ...defaultOptions, ...opts }
  }

  setOptions (newOpts) {
    this.uninstall()
    super.setOptions(newOpts)
    this.install()
  }

  install () {
    this.opts.sources.forEach((pluginId) => {
      const optsForRemoteSourcePlugin = { ...this.opts, sources: undefined }
      const plugin = availablePlugins.find(p => p.name === pluginId)
      this.uppy.use(plugin, optsForRemoteSourcePlugin)
      this.#installedPlugins.add(pluginId)
    })
  }

  uninstall () {
    for (const pluginId of this.#installedPlugins) {
      const plugin = this.uppy.getPlugin(pluginId)
      this.uppy.removePlugin(plugin)
      this.#installedPlugins.delete(pluginId)
    }
  }
}
