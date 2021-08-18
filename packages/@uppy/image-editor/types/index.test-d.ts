// TODO implement

import Uppy from '@uppy/core'
import ImageEditor from '..'

{
  const uppy = new Uppy()

  uppy.use(ImageEditor)

  uppy.on('file-editor:start', (file) => {
    const fileName = file.name
  })
  uppy.on('file-editor:complete', (file) => {
    const fileName = file.name
  })
}
