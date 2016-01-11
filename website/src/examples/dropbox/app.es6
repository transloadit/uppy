import Uppy from 'uppy/core'
import { Dropbox } from 'uppy/plugins'

const uppy = new Uppy({wait: false})
uppy
  .use(Dropbox, {selector: '#target'})
  .run()

const drop = new Dropbox();

console.log(uppy.type);
