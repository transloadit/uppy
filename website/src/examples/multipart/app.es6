import Uppy from 'uppy/core'
import { Formtag, Multipart, Tus10, ProgressBar } from 'uppy/plugins'

const uppy = new Uppy({debug: true, autoProceed: false})

uppy
  .use(Formtag)
  .use(Multipart, {
    endpoint: '//api2.transloadit.com',
    bundle: true,
    fieldName: 'files[]'
  })
  .use(ProgressBar, {target: 'body'})
  // .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/'})
  .run()

console.log('Uppy ' + uppy.type + ' loaded')
