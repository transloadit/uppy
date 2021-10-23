import Uppy from '@uppy/core'
import DropTarget from '..'

{
  const uppy = new Uppy()

  uppy.use(DropTarget, {
    target: 'body',
    onDragOver: (event) => event.clientX,
    onDrop: (event) => event.clientX,
    onDragLeave: (event) => event.clientX,
  })
}
