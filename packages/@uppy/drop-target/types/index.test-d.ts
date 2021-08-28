import Uppy from '@uppy/core'
import DropTarget from '..'

{
  const uppy = new Uppy()
  uppy.use(DropTarget, {
    target: 'body',
  })
}
