import Uppy from 'uppy/core'
import { Formtag, Multipart } from 'uppy/plugins'

const uppy = new Uppy({wait: false})

uppy
  .use(Formtag, {
    selector          : '#myform1 [type = "file"],#myform2 [type = "file"]',
    doneButtonSelector: '#myupload'
  })
  .use(Multipart, {
    endpoint : '//api2.transloadit.com',
    bundle   : true,
    fieldName: 'files[]'
  })
  .run()

console.log('Uppy ' + uppy.type + ' loaded')
