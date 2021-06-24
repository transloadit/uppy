import ThumbnailGenerator = require('../')
import Uppy = require('@uppy/core')

{
 const uppy = Uppy()
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
