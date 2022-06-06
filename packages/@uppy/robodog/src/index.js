const form = require('./form')
const dashboard = require('./dashboard')
const pick = require('./pick')
const upload = require('./upload')

module.exports = {
  dashboard,
  form,
  pick,
  upload,
  // We need to keep the require here because we're using `babel-plugin-inline-package-json`.
  // eslint-disable-next-line global-require
  VERSION: require('../package.json').version,
}
