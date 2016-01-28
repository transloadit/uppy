// import Uppy from 'uppy/core'
// import { DragDrop, Tus10 } from 'uppy/plugins'
import Uppy from 'uppy/core'
import { Modal, DragDrop } from 'uppy/plugins'

const defaults = {
  width               : 380, // max = 640
  height              : 280, // max = 350
  showClose           : false,
  showCloseText       : '',
  closeByEscape       : true,
  closeByDocument     : true,
  holderClass         : '',
  overlayClass        : '',
  enableStackAnimation: false,
  onBlurContainer     : '',
  openOnEvent         : true,
  setEvent            : 'click',
  onLoad              : false,
  onUnload            : false,
  onClosing           : false,
  template            : '<p>This is test popin content!</p>'
}

const uppy = new Uppy({wait: false})

uppy.use(Modal, {selector: '.ModalTrigger'})
