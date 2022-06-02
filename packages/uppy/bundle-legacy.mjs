// adding this directive to make sure the output file is using strict mode:

'use strict'

import 'core-js'
import 'whatwg-fetch'
import 'abortcontroller-polyfill/dist/polyfill-patch-fetch'
// Order matters: AbortController needs fetch which needs Promise.

import 'md-gum-polyfill'
import ResizeObserver from 'resize-observer-polyfill'

if (typeof window.ResizeObserver !== 'function') window.ResizeObserver = ResizeObserver

// Needed for Babel
import 'regenerator-runtime/runtime'

import './bundle.mjs'
