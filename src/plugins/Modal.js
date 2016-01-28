import Plugin from './Plugin'
import { Modal, Authorize, Browser, Sidebar } from './templates'

export default class Modal extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'selecter'
    this.connect = this.connect.bind(this)
    this.render = this.render.bind(this)
    this.initModal = this.initModal.bind(this)

    this.parent = this.opts.parent || document.body

    this.initModal()

    if (this.opts.target) {
      this.trigger = this.opts.target

      const trigger = document.querySelector(this.opts.target)
      trigger.addEventListener('click', (e) => {

      })
    }
  }

  connect (target) {
    const trigger = document.querySelector(target)
    const modal = this.modal || document.getElementById('UppyModal')

    if (!trigger) {
      console.error('Uppy: Error. Modal trigger not found.')
    }

    trigger.addEventListener('click', () => this.openModal)
  }

  initModal () {
    const modal = document.createElement('div')
    modal.id = 'UppyModal'

    this.parent.appendChild(modal)

    this.modal = document.getElementById('UppyModal')
  }

  openModal () {
    if (this.modal) {
      this.modal.classList.add('UppyModal--is-open')
      this.parent
    }
  }

  render (files) {
  }
}
