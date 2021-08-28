import Uppy from '@uppy/core'
import Facebook from '..'

{
  const uppy = new Uppy()
  uppy.use(Facebook, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    target: 'body',
    title: 'title',
  })
}
