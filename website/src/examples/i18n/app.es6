const Uppy = require('../../../../src/core/Core.js')
const Tus10 = require('../../../../src/plugins/GoogleDrive')

const uppy = new Uppy({debug: true, autoProceed: false})

uppy
  .use(Tus10, {endpoint: '//master.tus.io/files/'})
  .run()

console.log('--> Uppy Bundled version with Tus10 & Russian language pack has loaded')
