import ThumbnailGenerator from '../'
import Uppy from '@uppy/core'

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
        generatingThumbnails: ''
     }
   }
 })
}
