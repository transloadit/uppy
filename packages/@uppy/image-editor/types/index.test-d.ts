// TODO implement

import Uppy from '@uppy/core'
import ImageEditor from '..'

{
  const uppy = new Uppy()

  uppy.use(ImageEditor)

  uppy.on('file-editor:start', (file) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fileName = file.name
  })
  uppy.on('file-editor:complete', (file) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fileName = file.name
  })
  uppy.on('file-editor:cancel', (file) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fileName = file.name
  })
}
