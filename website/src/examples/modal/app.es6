import Uppy from '../../../../src/core/Core.js'
import Dummy from '../../../../src/plugins/Dummy.js'
import GoogleDrive from '../../../../src/plugins/GoogleDrive.js'
import DragDrop from '../../../../src/plugins/DragDrop.js'
import Modal from '../../../../src/plugins/Modal.js'
import ProgressBar from '../../../../src/plugins/ProgressBar.js'
import Tus10 from '../../../../src/plugins/Tus10.js'

const uppy = new Uppy({debug: true})
uppy
  .use(Modal)
  .use(Dummy, {target: Modal})
  .use(ProgressBar, {target: Modal})
  .use(DragDrop, {target: Modal})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/'})
  // .use(GoogleDrive, {target: Modal})
  .run()
