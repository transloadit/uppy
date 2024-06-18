import Uppy, { UIPlugin, type UIPluginOptions } from '@uppy/core'
import GooglePhotos from '..'

class SomePlugin extends UIPlugin<UIPluginOptions> {}

const uppy = new Uppy()
uppy.use(GooglePhotos, { companionUrl: '' })
uppy.use(GooglePhotos, { target: SomePlugin, companionUrl: '' })
uppy.use(GooglePhotos, {
  target: document.querySelector('#gphotos') || (undefined as never),
  companionUrl: '',
})
