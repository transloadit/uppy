import Uppy from '@uppy/core'
import ThumbnailGenerator from '..'

{
  const uppy = new Uppy()
  uppy.use(ThumbnailGenerator, {
    thumbnailWidth: 100,
    thumbnailHeight: 100,
    thumbnailType: 'type',
    waitForThumbnailsBeforeUpload: true,
    lazy: true,
    locale: {
      strings: {
        generatingThumbnails: '',
      },
    },
  })

  uppy.on('thumbnail:generated', (file, preview) => {
    const img = document.createElement('img')
    img.src = preview
    img.width = 100
    document.body.appendChild(img)
  })
}
