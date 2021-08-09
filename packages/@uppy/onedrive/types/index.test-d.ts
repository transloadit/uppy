import Uppy from '@uppy/core'
import OneDrive from '..'

{
  const uppy = new Uppy()
  uppy.use(OneDrive, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    target: 'body',
    title: 'title',
  })
}
