import Uppy from '../src/core/Core.js'
import Modal from '../src/plugins/Modal'
import Dummy from '../src/plugins/Dummy'
// import DragDrop from '../src/plugins/DragDrop'
import GoogleDrive from '../src/plugins/GoogleDrive'
import ProgressBar from '../src/plugins/ProgressBar'
import Tus10 from '../src/plugins/Tus10'

const uppy = new Uppy({debug: true})
  .use(Modal, {trigger: '#uppyModalOpener'})
  // .use(DragDrop, {target: Modal})
  .use(GoogleDrive, {target: Modal, host: 'http://ya.ru'})
  .use(Dummy, {target: Modal})
  .use(ProgressBar, {target: Modal})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/'})

uppy.run()

document.querySelector('#uppyModalOpener').click()
