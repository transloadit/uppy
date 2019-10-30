import Uppy = require('@uppy/core')
import GoogleDrive = require('../')

class SomePlugin extends Uppy.Plugin<{}> {}

const uppy = Uppy<Uppy.StrictTypes>()
uppy.use(GoogleDrive, { companionUrl: '' })
uppy.use(GoogleDrive, { target: SomePlugin, companionUrl: '' })
uppy.use(GoogleDrive, { target: document.querySelector('#gdrive')!, companionUrl: '' })
