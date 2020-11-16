module.exports.providers = {
  box: require('./box'),
  drive: require('./drive'),
  dropbox: require('./dropbox'),
  instagram: require('./instagram'),
  onedrive: require('./onedrive'),
  facebook: require('./facebook'),
  zoom: require('./zoom')
}

module.exports.defaults = require('./constants')
