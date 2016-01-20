import Uppy from 'uppy/core'
import { Dropbox } from 'uppy/plugins'

const uppy = new Uppy({wait: false})
uppy
  .use(Dropbox, {selector: '#target'})
  .run()

console.log(uppy.type)
