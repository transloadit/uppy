import Uppy from '../../../../src/core/Core.js'
import Formtag from '../../../../src/plugins/Formtag.js'
import Multipart from '../../../../src/plugins/Multipart.js'
import ProgressBar from '../../../../src/plugins/ProgressBar.js'

// import Uppy from 'uppy/core'
// import { Formtag, Multipart, ProgressBar } from 'uppy/plugins'

const uppy = new Uppy({debug: true, autoProceed: false})

uppy
  .use(Formtag)
  .use(Multipart, {
    endpoint: '//api2.transloadit.com',
    bundle: true,
    fieldName: 'files[]'
  })
  .use(ProgressBar, {target: 'body'})
  .run()

console.log('Uppy with Formtag and Multipart is loaded')
