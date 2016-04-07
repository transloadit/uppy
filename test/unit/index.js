require('babel/register')({
  stage: 0
})

require('./core.spec.js')
require('./translator.spec.js')
