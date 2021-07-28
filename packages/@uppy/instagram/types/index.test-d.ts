import Uppy from '@uppy/core'
import Instagram from '..'

{
  const uppy = new Uppy()
  uppy.use(Instagram, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    replaceTargetContent: false,
    target: 'body',
    title: 'title',
  })
}
