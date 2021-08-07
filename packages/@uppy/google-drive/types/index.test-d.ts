import Uppy, { UIPlugin, PluginOptions } from '@uppy/core'
import GoogleDrive from '..'

class SomePlugin extends UIPlugin<PluginOptions> {}

const uppy = new Uppy()
uppy.use(GoogleDrive, { companionUrl: '' })
uppy.use(GoogleDrive, { target: SomePlugin, companionUrl: '' })
uppy.use(GoogleDrive, { target: document.querySelector('#gdrive') || (undefined as never), companionUrl: '' })
