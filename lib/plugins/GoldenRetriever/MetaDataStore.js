'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Get uppy instance IDs for which state is stored.
 */
function findUppyInstances() {
  var instances = [];
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (/^uppyState:/.test(key)) {
      instances.push(key.slice('uppyState:'.length));
    }
  }
  return instances;
}

/**
 * Try to JSON-parse a string, return null on failure.
 */
function maybeParse(str) {
  try {
    return JSON.parse(str);
  } catch (err) {
    return null;
  }
}

var cleanedUp = false;
module.exports = function () {
  function MetaDataStore(opts) {
    _classCallCheck(this, MetaDataStore);

    this.opts = _extends({
      expires: 24 * 60 * 60 * 1000 // 24 hours
    }, opts);
    this.name = 'uppyState:' + opts.storeName;

    if (!cleanedUp) {
      cleanedUp = true;
      MetaDataStore.cleanup();
    }
  }

  /**
   *
   */


  MetaDataStore.prototype.load = function load() {
    var savedState = localStorage.getItem(this.name);
    if (!savedState) return null;
    var data = maybeParse(savedState);
    if (!data) return null;

    // Upgrade pre-0.20.0 uppyState: it used to be just a flat object,
    // without `expires`.
    if (!data.metadata) {
      this.save(data);
      return data;
    }

    return data.metadata;
  };

  MetaDataStore.prototype.save = function save(metadata) {
    var expires = Date.now() + this.opts.expires;
    var state = JSON.stringify({
      metadata: metadata,
      expires: expires
    });
    localStorage.setItem(this.name, state);
  };

  /**
   * Remove all expired state.
   */


  MetaDataStore.cleanup = function cleanup() {
    var instanceIDs = findUppyInstances();
    var now = Date.now();
    instanceIDs.forEach(function (id) {
      var data = localStorage.getItem('uppyState:' + id);
      if (!data) return null;
      var obj = maybeParse(data);
      if (!obj) return null;

      if (obj.expires && obj.expires < now) {
        localStorage.removeItem('uppyState:' + id);
      }
    });
  };

  return MetaDataStore;
}();
//# sourceMappingURL=MetaDataStore.js.map