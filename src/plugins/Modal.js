import Plugin from './Plugin'
import { ModalTemplate, Authorize, Browser, Sidebar } from './templates'

export default class Modal extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'something'
    this.connect = this.connect.bind(this)
    this.render = this.render.bind(this)
    this.initModal = this.initModal.bind(this)
    this.onDocumentClick = this.onDocumentClick.bind(this)

    this.parent = this.opts.parent || document.body

    this.initModal()

    if (this.opts.selector) {
      this.trigger = this.opts.selector
      this.connect(this.trigger)
    }
  }

  connect (target) {
    const trigger = document.querySelector(target)

    if (!trigger) {
      console.error('Uppy: Error. Modal trigger element not found.')
    }
    trigger.addEventListener('click', () => {
      this.openModal()
    })
  }

  initModal () {
    let overlay = document.createElement('div')
    overlay.classList.add('UppyModalOverlay')
    document.body.appendChild(overlay)

    overlay.addEventListener('click', )

    let modal = document.createElement('div')
    modal.id = 'UppyModal'

    this.parent.appendChild(modal)

    modal.innerHTML = ModalTemplate()

    let a  = document.createElement('a')

    const linkText = document.createTextNode('close')
    a.appendChild(linkText)
    a.classList.add('UppyModal-closeBtn')
    a.addEventListener('click', this.onDocumentClick)

    modal.appendChild(a)

    this.modal = document.getElementById('UppyModal')
  }

  openModal () {
    if (this.modal) {
      console.log(this.modal)
      this.modal.classList.toggle('UppyModal--is-open')
      document.body.classList.toggle('UppyModal--is-open')
    }
  }

  closeModal () {
    document.body.classList.toggle('avgrund-ready')
    document.body.classList.toggle('UppyModal--is-open')

    setTimeout(() => this.modal.classList.toggle('UppyModal--is-open'), 500)
  }

  onDocumentClick(e) {
    e.preventDefault()
    this.closeModal()
  }

  render (files) {
    this.modal.innerHTML = ModalTemplate()
  }
}
