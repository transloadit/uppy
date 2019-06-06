const Uppy = require('@uppy/core')
const Form = require('@uppy/form')
const StatusBar = require('@uppy/status-bar')
const findDOMElement = require('@uppy/utils/lib/findDOMElement')
const AttachFileInputs = require('./AttachFileInputs')
const TransloaditFormResult = require('./TransloaditFormResult')
const addDashboardPlugin = require('./addDashboardPlugin')
const addTransloaditPlugin = require('./addTransloaditPlugin')
const addProviders = require('./addProviders')

function form (target, opts) {
  const uppy = Uppy(opts)
  addTransloaditPlugin(uppy, opts)

  uppy.use(TransloaditFormResult, {
    target,
    transloaditPluginId: 'Transloadit',
    name: 'transloadit'
  })

  let submitOnSuccess = true
  if (opts.hasOwnProperty('submitOnSuccess')) {
    submitOnSuccess = !!opts.submitOnSuccess
  }

  uppy.use(Form, {
    target,
    triggerUploadOnSubmit: true,
    submitOnSuccess: submitOnSuccess,
    addResultToForm: false // using custom implementation instead
  })

  const useDashboard = opts.dashboard || opts.modal

  if (useDashboard) {
    const dashboardTarget = findDOMElement(opts.dashboard) || document.body
    const dashboardId = 'form:Dashboard'
    const dashboardOpts = {
      id: dashboardId,
      target: dashboardTarget
    }
    if (opts.modal) {
      const trigger = 'input[type="file"]'
      const button = document.createElement('button')
      button.textContent = 'Select files'
      button.type = 'button'
      const old = findDOMElement(trigger, findDOMElement(target))
      old.parentNode.replaceChild(button, old)
      dashboardOpts.trigger = button
    } else {
      dashboardOpts.inline = true
      dashboardOpts.hideUploadButton = true
    }
    addDashboardPlugin(uppy, opts, dashboardOpts)

    if (Array.isArray(opts.providers)) {
      addProviders(uppy, opts.providers, {
        ...opts,
        target: uppy.getPlugin(dashboardId)
      })
    }
  } else {
    uppy.use(AttachFileInputs, { target })
  }

  if (opts.statusBar) {
    uppy.use(StatusBar, {
      target: opts.statusBar,
      // hide most of the things to keep our api simple,
      // we can change this in the future if someone needs it
      hideUploadButton: true,
      hideAfterFinish: true,
      hideRetryButton: true,
      hidePauseResumeButtons: true,
      hideCancelButtons: true
    })
  }

  return uppy
}

module.exports = form
