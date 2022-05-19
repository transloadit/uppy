export { default } from './Uppy.js'
export { default as UIPlugin } from './UIPlugin.js'
export { default as BasePlugin } from './BasePlugin.js'
export { debugLogger } from './loggers.js'

// TODO: remove all the following in the next major
/* eslint-disable import/first */
import Uppy from './Uppy.js'
import UIPlugin from './UIPlugin.js'
import BasePlugin from './BasePlugin.js'
import { debugLogger } from './loggers.js'

// Backward compatibility: we want those to keep being accessible as static
// properties of `Uppy` to avoid a breaking change.
Uppy.Uppy = Uppy
Uppy.UIPlugin = UIPlugin
Uppy.BasePlugin = BasePlugin
Uppy.debugLogger = debugLogger

export { Uppy }
