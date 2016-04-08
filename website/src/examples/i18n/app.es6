import Uppy from 'uppy/core'
import { Tus10 } from 'uppy/plugins'
import { ru_RU } from 'uppy/locales'

const uppy = new Uppy({wait: false, locales: ru_RU})

uppy
  .use(Tus10, {endpoint: 'http://master.tus.io:3020/files/'})
  .run()

console.log('--> Uppy Bundled version with Tus10 & Russian language pack has loaded')
