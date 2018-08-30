const Uppy = require('@uppy/core')
const Form = require('@uppy/form')
const findDOMElement = require('@uppy/utils/lib/findDOMElement')
const addTransloaditPlugin = require('./addTransloaditPlugin')

class TransloaditFormResult extends Uppy.Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)

    this.id = opts.id || 'TransloaditFormResult'
    this.type = 'modifier'

    this.onUpload = this.onUpload.bind(this)
  }

  getAssemblyStatuses (files) {
    const assemblyIds = []
    files.forEach((file) => {
      const assembly = file.transloadit && file.transloadit.assembly
      if (assembly && assemblyIds.indexOf(assembly) === -1) {
        assemblyIds.push(assembly)
      }
    })

    const tl = this.uppy.getPlugin('Transloadit')
    return assemblyIds.map((id) => tl.getAssembly(id))
  }

  onUpload ({ successful, failed }) {
    const assemblies = this.getAssemblyStatuses(successful)
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = this.opts.name
    input.value = JSON.stringify(assemblies)

    const target = findDOMElement(this.opts.target)
    target.appendChild(input)
  }

  install () {
    this.uppy.on('upload', this.onUpload)
  }
}

function form (target, opts) {
  const uppy = Uppy({
    restrictions: opts.restrictions
  })
  addTransloaditPlugin(uppy, opts)

  uppy.use(TransloaditFormResult, {
    target,
    name: 'transloadit'
  })

  uppy.use(Form, {
    target,
    submitOnSuccess: true,
    addResultToForm: false // using custom implementation instead
  })

  return uppy
}

module.exports = form
