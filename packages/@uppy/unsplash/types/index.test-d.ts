import Uppy from '@uppy/core'
import Unsplash from '..'

{
  const uppy = new Uppy()
  uppy.use(Unsplash, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    target: 'body',
    title: 'title',
  })
}
