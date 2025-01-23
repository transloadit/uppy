import { BasePlugin } from '@uppy/core'
import type {
  Uppy,
  UnknownProviderPlugin,
  DefinePluginOpts,
  Body,
  Meta,
} from '@uppy/core'
import Dropbox from '@uppy/dropbox'
import GoogleDrive from '@uppy/google-drive'
import GooglePhotos from '@uppy/google-photos'
import Instagram from '@uppy/instagram'
import Facebook from '@uppy/facebook'
import OneDrive from '@uppy/onedrive'
import Box from '@uppy/box'
import Unsplash from '@uppy/unsplash'
import Url from '@uppy/url'
import Zoom from '@uppy/zoom'

import type { CompanionPluginOptions } from '@uppy/companion-client'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'

const availablePlugins = {
  // Using a null-prototype object to avoid prototype pollution.
  __proto__: null,
  Box,
  Dropbox,
  Facebook,
  GoogleDrive,
  GooglePhotos,
  Instagram,
  OneDrive,
  Unsplash,
  Url,
  Zoom,
}

type AvailablePluginsKeys =
  | 'Box'
  | 'Dropbox'
  | 'Facebook'
  | 'GoogleDrive'
  | 'GooglePhotos'
  | 'Instagram'
  | 'OneDrive'
  | 'Unsplash'
  | 'Url'
  | 'Zoom'

type NestedCompanionKeysParams = {
  [key in AvailablePluginsKeys]?: CompanionPluginOptions['companionKeysParams']
}

export interface RemoteSourcesOptions
  extends Omit<CompanionPluginOptions, 'companionKeysParams'> {
  sources?: Array<AvailablePluginsKeys>
  // Individual remote source plugins set the `key` and `credentialsName`
  // in `companionKeysParams` but because this is a preset we need to change
  // this to a record of plugin IDs to their respective `companionKeysParams`.
  companionKeysParams?: NestedCompanionKeysParams
}

const defaultOptions = {
  sources: Object.keys(availablePlugins) as Array<AvailablePluginsKeys>,
} satisfies Partial<RemoteSourcesOptions>

type Opts = DefinePluginOpts<RemoteSourcesOptions, keyof typeof defaultOptions>

export default class RemoteSources<
  M extends Meta,
  B extends Body,
> extends BasePlugin<Opts, M, B> {
  static VERSION = packageJson.version

  #installedPlugins: Set<UnknownProviderPlugin<M, B>> = new Set()

  constructor(uppy: Uppy<M, B>, opts: RemoteSourcesOptions) {
    super(uppy, { ...defaultOptions, ...opts })
    this.id = this.opts.id || 'RemoteSources'
    this.type = 'preset'

    if (this.opts.companionUrl == null) {
      throw new Error(
        'Please specify companionUrl for RemoteSources to work, see https://uppy.io/docs/remote-sources#companionUrl',
      )
    }
  }

  setOptions(newOpts: Partial<Opts>): void {
    this.uninstall()
    super.setOptions(newOpts)
    this.install()
  }

  install(): void {
    this.opts.sources.forEach((pluginId) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { sources, ...rest } = this.opts
      const optsForRemoteSourcePlugin: CompanionPluginOptions = {
        ...rest,
        companionKeysParams: this.opts.companionKeysParams?.[pluginId],
      }
      const plugin = availablePlugins[pluginId]
      if (plugin == null) {
        const pluginNames = Object.keys(availablePlugins)
        const formatter = new Intl.ListFormat('en', {
          style: 'long',
          type: 'disjunction',
        })
        throw new Error(
          `Invalid plugin: "${pluginId}" is not one of: ${formatter.format(pluginNames)}.`,
        )
      }
      this.uppy.use(plugin, optsForRemoteSourcePlugin)
      // `plugin` is a class, but we want to track the instance object
      // so we have to do `getPlugin` here.
      this.#installedPlugins.add(
        this.uppy.getPlugin(pluginId) as UnknownProviderPlugin<M, B>,
      )
    })
  }

  uninstall(): void {
    for (const plugin of this.#installedPlugins) {
      this.uppy.removePlugin(plugin)
    }
    this.#installedPlugins.clear()
  }
}
