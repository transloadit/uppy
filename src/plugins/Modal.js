import Plugin from './Plugin'
import { ModalTemplate } from './templates'
import Drive from './GoogleDrive'

export default class Modal extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    let GoogleDrive = new Drive()
    this.providers = [{ name: 'Local' }, { name: 'Google Drive', connect: GoogleDrive.connect }]
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
    document.body.classList.add('UppyModal--is-ready')

    let overlay = document.createElement('div')
    overlay.classList.add('UppyModalOverlay')
    document.body.appendChild(overlay)

    overlay.addEventListener('click', this.closeModal)

    let modal = document.createElement('div')
    modal.id = 'UppyModal'

    this.parent.appendChild(modal)

    modal.innerHTML = ModalTemplate({ providers: this.providers })

    let a = document.createElement('a')

    const linkText = document.createTextNode('close')
    a.appendChild(linkText)
    a.classList.add('UppyModal-closeBtn')
    a.addEventListener('click', this.onDocumentClick)

    modal.appendChild(a)

    this.modal = document.getElementById('UppyModal')

    this.providers.forEach(provider => {
      const elem = document.getElementById(`Uppy-${provider.name.split(' ').join('')}`)
      if (provider.name !== 'Local') {
        elem.addEventListener('click', e => {
          if (provider.name !== 'Local') {
            provider.connect(document.getElementById('UppyModalContent'))
          }
        })
      }
    })
  }

  openModal () {
    if (this.modal) {
      this.modal.classList.toggle('UppyModal--is-open')
      document.body.classList.toggle('UppyModal--is-open')
      document.body.classList.toggle('UppyModal--is-ready')
    }
  }

  closeModal () {
    document.body.classList.toggle('UppyModal--is-open')
    document.body.classList.toggle('UppyModal--is-ready')
    setTimeout(() => this.modal.classList.toggle('UppyModal--is-open'), 500)
  }

  onDocumentClick (e) {
    e.preventDefault()
    this.closeModal()
  }

  render (files) {
    this.modal.innerHTML = ModalTemplate({ providers: this.providers })
  }
}
