const { server } = require('./server')
const { app, companionOptions } = server()
module.exports = { app, companionOptions }
