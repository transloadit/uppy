const path = require('path')

module.exports = {
  replacements: {
    '^uppy/lib/(.*?)$': path.join(__dirname, '../../../src/$1')
  }
}
