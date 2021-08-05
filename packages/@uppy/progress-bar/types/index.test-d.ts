import Uppy from '@uppy/core'
import ProgressBar from '..'

{
  const uppy = new Uppy()
  uppy.use(ProgressBar, {
    target: 'body',
    hideAfterFinish: true,
    fixed: true,
  })
}
