import Uppy from '@uppy/core'
import RemoteSources from '..'

{
  const uppy = new Uppy()
  uppy.use(RemoteSources, {
    sources: ['Instagram', 'Url'],
    companionUrl: '',
    companionCookiesRule: 'same-origin',
  })
}
