import Uppy from '@uppy/core'
import Box from '..'

{
  const uppy = new Uppy()
  uppy.use(Box, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    replaceTargetContent: false,
    target: 'body',
    title: 'title',
  })
}
