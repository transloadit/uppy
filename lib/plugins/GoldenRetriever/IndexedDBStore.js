'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _Promise = typeof Promise === 'undefined' ? require('es6-promise').Promise : Promise;

var prettyBytes = require('prettier-bytes');
var indexedDB = typeof window !== 'undefined' && (window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB);

var isSupported = !!indexedDB;

var DB_NAME = 'uppy-blobs';
var STORE_NAME = 'files'; // maybe have a thumbnail store in the future
var DEFAULT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
var DB_VERSION = 3;

// Set default `expires` dates on existing stored blobs.
function migrateExpiration(store) {
  var request = store.openCursor();
  request.onsuccess = function (event) {
    var cursor = event.target.result;
    if (!cursor) {
      return;
    }
    var entry = cursor.value;
    entry.expires = Date.now() + DEFAULT_EXPIRY;
    cursor.update(entry);
  };
}

function connect(dbName) {
  var request = indexedDB.open(dbName, DB_VERSION);
  return new _Promise(function (resolve, reject) {
    request.onupgradeneeded = function (event) {
      var db = event.target.result;
      var transaction = event.currentTarget.transaction;

      if (event.oldVersion < 2) {
        // Added in v2: DB structure changed to a single shared object store
        var store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('store', 'store', { unique: false });
      }

      if (event.oldVersion < 3) {
        // Added in v3
        var _store = transaction.objectStore(STORE_NAME);
        _store.createIndex('expires', 'expires', { unique: false });

        migrateExpiration(_store);
      }

      transaction.oncomplete = function () {
        resolve(db);
      };
    };
    request.onsuccess = function (event) {
      resolve(event.target.result);
    };
    request.onerror = reject;
  });
}

function waitForRequest(request) {
  return new _Promise(function (resolve, reject) {
    request.onsuccess = function (event) {
      resolve(event.target.result);
    };
    request.onerror = reject;
  });
}

var cleanedUp = false;

var IndexedDBStore = function () {
  function IndexedDBStore(opts) {
    var _this = this;

    _classCallCheck(this, IndexedDBStore);

    this.opts = _extends({
      dbName: DB_NAME,
      storeName: 'default',
      expires: DEFAULT_EXPIRY, // 24 hours
      maxFileSize: 10 * 1024 * 1024, // 10 MB
      maxTotalSize: 300 * 1024 * 1024 // 300 MB
    }, opts);

    this.name = this.opts.storeName;

    var createConnection = function createConnection() {
      return connect(_this.opts.dbName);
    };

    if (!cleanedUp) {
      cleanedUp = true;
      this.ready = IndexedDBStore.cleanup().then(createConnection, createConnection);
    } else {
      this.ready = createConnection;
    }
  }

  IndexedDBStore.prototype.key = function key(fileID) {
    return this.name + '!' + fileID;
  };

  /**
   * List all file blobs currently in the store.
   */


  IndexedDBStore.prototype.list = function list() {
    var _this2 = this;

    return this.ready.then(function (db) {
      var transaction = db.transaction([STORE_NAME], 'readonly');
      var store = transaction.objectStore(STORE_NAME);
      var request = store.index('store').getAll(IDBKeyRange.only(_this2.name));
      return waitForRequest(request);
    }).then(function (files) {
      var result = {};
      files.forEach(function (file) {
        result[file.fileID] = file.data;
      });
      return result;
    });
  };

  /**
   * Get one file blob from the store.
   */


  IndexedDBStore.prototype.get = function get(fileID) {
    var _this3 = this;

    return this.ready.then(function (db) {
      var transaction = db.transaction([STORE_NAME], 'readonly');
      var request = transaction.objectStore(STORE_NAME).get(_this3.key(fileID));
      return waitForRequest(request);
    }).then(function (result) {
      return {
        id: result.data.fileID,
        data: result.data.data
      };
    });
  };

  /**
   * Get the total size of all stored files.
   *
   * @private
   */


  IndexedDBStore.prototype.getSize = function getSize() {
    var _this4 = this;

    return this.ready.then(function (db) {
      var transaction = db.transaction([STORE_NAME], 'readonly');
      var store = transaction.objectStore(STORE_NAME);
      var request = store.index('store').openCursor(IDBKeyRange.only(_this4.name));
      return new _Promise(function (resolve, reject) {
        var size = 0;
        request.onsuccess = function (event) {
          var cursor = event.target.result;
          if (cursor) {
            size += cursor.value.data.size;
            cursor.continue();
          } else {
            resolve(size);
          }
        };
        request.onerror = function () {
          reject(new Error('Could not retrieve stored blobs size'));
        };
      });
    });
  };

  /**
   * Save a file in the store.
   */


  IndexedDBStore.prototype.put = function put(file) {
    var _this5 = this;

    if (file.data.size > this.opts.maxFileSize) {
      return Promise.reject(new Error('File is too big to store.'));
    }
    return this.getSize().then(function (size) {
      if (size > _this5.opts.maxTotalSize) {
        return Promise.reject(new Error('No space left'));
      }
      return _this5.ready;
    }).then(function (db) {
      var transaction = db.transaction([STORE_NAME], 'readwrite');
      var request = transaction.objectStore(STORE_NAME).add({
        id: _this5.key(file.id),
        fileID: file.id,
        store: _this5.name,
        expires: Date.now() + _this5.opts.expires,
        data: file.data
      });
      return waitForRequest(request);
    });
  };

  /**
   * Delete a file blob from the store.
   */


  IndexedDBStore.prototype.delete = function _delete(fileID) {
    var _this6 = this;

    return this.ready.then(function (db) {
      var transaction = db.transaction([STORE_NAME], 'readwrite');
      var request = transaction.objectStore(STORE_NAME).delete(_this6.key(fileID));
      return waitForRequest(request);
    });
  };

  /**
   * Delete all stored blobs that have an expiry date that is before Date.now().
   * This is a static method because it deletes expired blobs from _all_ Uppy instances.
   */


  IndexedDBStore.cleanup = function cleanup() {
    return connect(DB_NAME).then(function (db) {
      var transaction = db.transaction([STORE_NAME], 'readwrite');
      var store = transaction.objectStore(STORE_NAME);
      var request = store.index('expires').openCursor(IDBKeyRange.upperBound(Date.now()));
      return new _Promise(function (resolve, reject) {
        request.onsuccess = function (event) {
          var cursor = event.target.result;
          if (cursor) {
            var entry = cursor.value;
            console.log('[IndexedDBStore] Deleting record', entry.fileID, 'of size', prettyBytes(entry.data.size), '- expired on', new Date(entry.expires));
            cursor.delete(); // Ignoring return value … it's not terrible if this goes wrong.
            cursor.continue();
          } else {
            resolve(db);
          }
        };
        request.onerror = reject;
      });
    }).then(function (db) {
      db.close();
    });
  };

  return IndexedDBStore;
}();

IndexedDBStore.isSupported = isSupported;

module.exports = IndexedDBStore;
//# sourceMappingURL=IndexedDBStore.js.map