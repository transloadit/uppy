import Uppy from '../../../../src/core/Core.js'
import Tus10 from '../../../../src/plugins/GoogleDrive'
import russian from '../../../../src/locales/ru_RU'

const uppy = new Uppy({debug: true, autoProceed: false, locale: russian})

uppy
  .use(Tus10, {endpoint: '//master.tus.io/files/'})
  .run()

console.log('--> Uppy Bundled version with Tus10 & Russian language pack has loaded')
