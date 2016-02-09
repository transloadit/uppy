import Uppy from 'uppy/core'
import { Drive } from 'uppy/plugins'

const uppy = new Uppy({wait: false})

uppy
  .use(Drive, {selector: '#target'})
  .run()

console.log(uppy.type)
