const box = require('./box')
const drive = require('./drive')
const dropbox =  require('./dropbox')
const instagram = require('./instagram')
const onedrive = require('./onedrive')
const facebook = require('./facebook')
const zoom = require('./zoom')

module.exports.providers = {
  box,
  drive,
  dropbox,
  instagram,
  onedrive,
  facebook,
  zoom,
}

module.exports.defaults = require('./constants')
