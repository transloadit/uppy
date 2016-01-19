import Uppy from 'uppy/core'
import { DragDrop, Tus10 } from 'uppy/plugins'

const ru = require('../../../../src/locale/ru.js')

const uppy = new Uppy({wait: false, locale: ru})
const files = uppy
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/'})
  .run()

console.log('--> Uppy Bundled version with Tus10 & Russian language pack has loaded')
