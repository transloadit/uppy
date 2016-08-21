import Uppy from '../../../../src/core/Core.js'
import Formtag from '../../../../src/plugins/Formtag.js'
import Multipart from '../../../../src/plugins/Multipart.js'
import ProgressBar from '../../../../src/plugins/ProgressBar.js'

const uppy = new Uppy({debug: true, autoProceed: false})

uppy
  .use(Formtag)
  .use(Multipart, {
    endpoint: '//api2.transloadit.com',
    bundle: true,
    fieldName: 'files[]'
  })
  // by default Uppy removes everything inside target container,
  // but we surely don’t want to do that in the case of body, so replaceTargetContent: false
  .use(ProgressBar, {
    target: 'body',
    replaceTargetContent: false,
    fixed: true
  })
  .run()

console.log('Uppy with Formtag and Multipart is loaded')
