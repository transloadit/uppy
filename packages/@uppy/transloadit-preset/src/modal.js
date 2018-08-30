const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const addTransloaditPlugin = require('./addTransloaditPlugin')

function modal (target, opts) {
  const uppy = Uppy({})
  addTransloaditPlugin(uppy, opts)

  return new Promise((resolve, reject) => {
  }).then(() => {
    return uppy.upload()
  })
}

module.exports = modal
