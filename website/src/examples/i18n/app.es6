import Uppy from '../../../../src/core/Core.js'
import Tus10 from '../../../../src/plugins/GoogleDrive'
import russian from '../../../../src/locales/ru_RU'
// import Uppy from 'uppy/core'
// import { Tus10 } from 'uppy/plugins'
// import { ru_RU } from 'uppy/locales'

const uppy = new Uppy({debug: true, wait: false, locales: russian})

uppy
  .use(Tus10, {endpoint: 'http://master.tus.io:3020/files/'})
  .run()

console.log('--> Uppy Bundled version with Tus10 & Russian language pack has loaded')
