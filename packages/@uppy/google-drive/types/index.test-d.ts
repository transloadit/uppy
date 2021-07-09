import Uppy, { UIPlugin } from '@uppy/core'
import GoogleDrive from '../'

class SomePlugin extends UIPlugin<{}> {}

const uppy = new Uppy()
uppy.use(GoogleDrive, { companionUrl: '' })
uppy.use(GoogleDrive, { target: SomePlugin, companionUrl: '' })
uppy.use(GoogleDrive, { target: document.querySelector('#gdrive')!, companionUrl: '' })
