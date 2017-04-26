require('babel-register')
require('isomorphic-fetch')
require('./core.spec.js')
require('./translator.spec.js')
require('./Transloadit.spec.js')
// TODO: enable once getFile error is fixed
// require('./GoogleDrive.spec.js')
