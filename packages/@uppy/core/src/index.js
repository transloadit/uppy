'use strict'

const Uppy = require('./Uppy')
const UIPlugin = require('./UIPlugin')
const BasePlugin = require('./BasePlugin')
const { debugLogger } = require('./loggers')

module.exports = Uppy
module.exports.Uppy = Uppy
module.exports.UIPlugin = UIPlugin
module.exports.BasePlugin = BasePlugin
module.exports.debugLogger = debugLogger
