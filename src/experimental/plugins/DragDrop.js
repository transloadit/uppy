const DRAG_DROP_SUPPORTED = 'DRAG_DROP_SUPPORTED'

/**
 * Drag & Drop plugin
 *
 */
export default class DragDrop {
  constructor (opts) {
    // Bind `this` to class methods
    this.checkDragDropSupport = this.checkDragDropSupport.bind(this)
  }

  getInitialState () {
    return {
      dragDropSupported: this.checkDragDropSupport()
    }
  }

  reducer (state = this.getInitialState(), action) {
    switch (action.type) {
      case DRAG_DROP_SUPPORTED:
        return {
          dragDropSupported: action.payload.dragDropSupported
        }
    }
  }

  /**
   * Checks if the browser supports Drag & Drop (not supported on mobile devices, for example).
   * @return {Boolean} true if supported, false otherwise
   */
  checkDragDropSupport () {
    const div = document.createElement('div')

    if (!('draggable' in div) || !('ondragstart' in div && 'ondrop' in div)) {
      return false
    }

    if (!('FormData' in window)) {
      return false
    }

    if (!('FileReader' in window)) {
      return false
    }

    return true
  }
}

DragDrop.actions = {
  checkDragDropSupport () {
    return {
      type: 'DRAG_DROP_SUPPORTED',
      payload: {
        dragDropSupported: this.checkDragDropSupport()
      }
    }
  }
}
