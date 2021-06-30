require('es6-promise/auto')
require('whatwg-fetch')
require('abortcontroller-polyfill/dist/polyfill-patch-fetch')
// Order matters: AbortController needs fetch which needs Promise.

const mathLog2 = require('math-log2')
require('md-gum-polyfill')
const ResizeObserver = require('resize-observer-polyfill')
require('symbol-es6')
require('url-polyfill')

if (typeof Math.log2 !== 'function') Math.log2 = mathLog2
if (typeof window.ResizeObserver !== 'function') window.ResizeObserver = ResizeObserver

module.exports = require('.')
