import Uppy from 'uppy/core'
import { Dummy, DragDrop, Modal, ProgressBar, Present, Tus10 } from 'uppy/plugins'
// GoogleDrive,

const uppy = new Uppy({debug: true})
uppy
  .use(Modal, {trigger: '#uppyModalOpener'})
  .use(Dummy, {target: Modal})
  // .use(GoogleDrive, {target: Modal})
  .use(ProgressBar, {target: Modal})
  .use(DragDrop, {target: Modal})
  .use(Present, {target: Modal})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/'})
  .run()
