require('core-js')
require('whatwg-fetch')
require('abortcontroller-polyfill/dist/polyfill-patch-fetch')
// Order matters: AbortController needs fetch which needs Promise.

require('md-gum-polyfill')
const ResizeObserver = require('resize-observer-polyfill')

if (typeof window.ResizeObserver !== 'function') window.ResizeObserver = ResizeObserver

// Needed for Babel
require("regenerator-runtime/runtime")

require('./bundle.js')
