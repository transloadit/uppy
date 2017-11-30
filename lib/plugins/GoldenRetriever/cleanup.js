'use strict';

var IndexedDBStore = require('./IndexedDBStore');
var MetaDataStore = require('./MetaDataStore');

/**
 * Clean old blobs without needing to import all of Uppy.
 */
module.exports = function cleanup() {
  MetaDataStore.cleanup();
  IndexedDBStore.cleanup();
};
//# sourceMappingURL=cleanup.js.map