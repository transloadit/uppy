const form = require('./form')
const dashboard = require('./dashboard')
const pick = require('./pick')
const upload = require('./upload')
const { version } = require('../package.json')

module.exports = {
  dashboard,
  form,
  pick,
  upload,
  VERSION: version,
}
