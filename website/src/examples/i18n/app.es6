const Uppy = require('uppy/lib/core/Core')
const Tus = require('uppy/lib/plugins/GoogleDrive')

const uppy = new Uppy({debug: true, autoProceed: false})

uppy
  .use(Tus, {endpoint: '//master.tus.io/files/'})
  .run()

console.log('--> Uppy Bundled version with Tus & Russian language pack has loaded')
