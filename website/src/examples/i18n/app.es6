const Uppy = require('uppy/lib/core/Core')
const Tus10 = require('uppy/lib/plugins/GoogleDrive')

const uppy = new Uppy({debug: true, autoProceed: false})

uppy
  .use(Tus10, {endpoint: '//master.tus.io/files/'})
  .run()

console.log('--> Uppy Bundled version with Tus10 & Russian language pack has loaded')
