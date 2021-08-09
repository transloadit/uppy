import Uppy from '@uppy/core'
import Dropbox from '..'

{
  const uppy = new Uppy()
  uppy.use(Dropbox, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    target: 'body',
    title: 'title',
  })
}
