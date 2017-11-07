'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _Promise = typeof Promise === 'undefined' ? require('es6-promise').Promise : Promise;

var Translator = require('../../core/Translator');
var Plugin = require('../Plugin');
var Client = require('./Client');
var StatusSocket = require('./Socket');

/**
 * Upload files to Transloadit using Tus.
 */
module.exports = function (_Plugin) {
  _inherits(Transloadit, _Plugin);

  function Transloadit(core, opts) {
    _classCallCheck(this, Transloadit);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, core, opts));

    _this.type = 'uploader';
    _this.id = 'Transloadit';
    _this.title = 'Transloadit';

    var defaultLocale = {
      strings: {
        creatingAssembly: 'Preparing upload...',
        creatingAssemblyFailed: 'Transloadit: Could not create assembly',
        encoding: 'Encoding...'
      }
    };

    var defaultOptions = {
      waitForEncoding: false,
      waitForMetadata: false,
      alwaysRunAssembly: false, // TODO name
      importFromUploadURLs: false,
      signature: null,
      params: null,
      fields: {},
      getAssemblyOptions: function getAssemblyOptions(file, options) {
        return {
          params: options.params,
          signature: options.signature,
          fields: options.fields
        };
      },

      locale: defaultLocale
    };

    _this.opts = _extends({}, defaultOptions, opts);

    _this.locale = _extends({}, defaultLocale, _this.opts.locale);
    _this.locale.strings = _extends({}, defaultLocale.strings, _this.opts.locale.strings);

    _this.translator = new Translator({ locale: _this.locale });
    _this.i18n = _this.translator.translate.bind(_this.translator);

    _this.prepareUpload = _this.prepareUpload.bind(_this);
    _this.afterUpload = _this.afterUpload.bind(_this);
    _this.onFileUploadURLAvailable = _this.onFileUploadURLAvailable.bind(_this);

    if (_this.opts.params) {
      _this.validateParams(_this.opts.params);
    }

    _this.client = new Client();
    _this.sockets = {};
    return _this;
  }

  Transloadit.prototype.validateParams = function validateParams(params) {
    if (!params) {
      throw new Error('Transloadit: The `params` option is required.');
    }

    if (typeof params === 'string') {
      try {
        params = JSON.parse(params);
      } catch (err) {
        // Tell the user that this is not an Uppy bug!
        err.message = 'Transloadit: The `params` option is a malformed JSON string: ' + err.message;
        throw err;
      }
    }

    if (!params.auth || !params.auth.key) {
      throw new Error('Transloadit: The `params.auth.key` option is required. ' + 'You can find your Transloadit API key at https://transloadit.com/accounts/credentials.');
    }
  };

  Transloadit.prototype.getAssemblyOptions = function getAssemblyOptions(fileIDs) {
    var _this2 = this;

    var options = this.opts;
    return Promise.all(fileIDs.map(function (fileID) {
      var file = _this2.core.getFile(fileID);
      var promise = Promise.resolve().then(function () {
        return options.getAssemblyOptions(file, options);
      });
      return promise.then(function (assemblyOptions) {
        _this2.validateParams(assemblyOptions.params);

        return {
          fileIDs: [fileID],
          options: assemblyOptions
        };
      });
    }));
  };

  Transloadit.prototype.dedupeAssemblyOptions = function dedupeAssemblyOptions(list) {
    var dedupeMap = Object.create(null);
    list.forEach(function (_ref) {
      var fileIDs = _ref.fileIDs,
          options = _ref.options;

      var id = JSON.stringify(options);
      if (dedupeMap[id]) {
        var _dedupeMap$id$fileIDs;

        (_dedupeMap$id$fileIDs = dedupeMap[id].fileIDs).push.apply(_dedupeMap$id$fileIDs, fileIDs);
      } else {
        dedupeMap[id] = {
          options: options,
          fileIDs: [].concat(fileIDs)
        };
      }
    });

    return Object.keys(dedupeMap).map(function (id) {
      return dedupeMap[id];
    });
  };

  Transloadit.prototype.createAssembly = function createAssembly(fileIDs, uploadID, options) {
    var _this3 = this;

    var pluginOptions = this.opts;

    this.core.log('Transloadit: create assembly');

    return this.client.createAssembly({
      params: options.params,
      fields: options.fields,
      expectedFiles: fileIDs.length,
      signature: options.signature
    }).then(function (assembly) {
      var _extends2, _extends3;

      // Store the list of assemblies related to this upload.
      var state = _this3.getPluginState();
      var assemblyList = state.uploadsAssemblies[uploadID];
      var uploadsAssemblies = _extends({}, state.uploadsAssemblies, (_extends2 = {}, _extends2[uploadID] = assemblyList.concat([assembly.assembly_id]), _extends2));

      _this3.setPluginState({
        assemblies: _extends(state.assemblies, (_extends3 = {}, _extends3[assembly.assembly_id] = assembly, _extends3)),
        uploadsAssemblies: uploadsAssemblies
      });

      function attachAssemblyMetadata(file, assembly) {
        // Attach meta parameters for the Tus plugin. See:
        // https://github.com/tus/tusd/wiki/Uploading-to-Transloadit-using-tus#uploading-using-tus
        // TODO Should this `meta` be moved to a `tus.meta` property instead?
        var tlMeta = {
          assembly_url: assembly.assembly_url,
          filename: file.name,
          fieldname: 'file'
        };
        var meta = _extends({}, file.meta, tlMeta);
        // Add assembly-specific Tus endpoint.
        var tus = _extends({}, file.tus, {
          endpoint: assembly.tus_url,
          // Only send assembly metadata to the tus endpoint.
          metaFields: Object.keys(tlMeta),
          // Make sure tus doesn't resume a previous upload.
          uploadUrl: null
        });
        var transloadit = {
          assembly: assembly.assembly_id
        };

        var newFile = _extends({}, file, { transloadit: transloadit });
        // Only configure the Tus plugin if we are uploading straight to Transloadit (the default).
        if (!pluginOptions.importFromUploadURLs) {
          _extends(newFile, { meta: meta, tus: tus });
        }
        return newFile;
      }

      var files = _extends({}, _this3.core.state.files);
      fileIDs.forEach(function (id) {
        files[id] = attachAssemblyMetadata(files[id], assembly);
      });

      _this3.core.setState({ files: files });

      _this3.core.emit('transloadit:assembly-created', assembly, fileIDs);

      return _this3.connectSocket(assembly).then(function () {
        return assembly;
      });
    }).then(function (assembly) {
      _this3.core.log('Transloadit: Created assembly');
      return assembly;
    }).catch(function (err) {
      _this3.core.info(_this3.i18n('creatingAssemblyFailed'), 'error', 0);

      // Reject the promise.
      throw err;
    });
  };

  Transloadit.prototype.shouldWait = function shouldWait() {
    return this.opts.waitForEncoding || this.opts.waitForMetadata;
  };

  /**
   * Used when `importFromUploadURLs` is enabled: reserves all files in
   * the assembly.
   */


  Transloadit.prototype.reserveFiles = function reserveFiles(assembly, fileIDs) {
    var _this4 = this;

    return Promise.all(fileIDs.map(function (fileID) {
      var file = _this4.core.getFile(fileID);
      return _this4.client.reserveFile(assembly, file);
    }));
  };

  /**
   * Used when `importFromUploadURLs` is enabled: adds files to the assembly
   * once they have been fully uploaded.
   */


  Transloadit.prototype.onFileUploadURLAvailable = function onFileUploadURLAvailable(fileID) {
    var _this5 = this;

    var file = this.core.getFile(fileID);
    if (!file || !file.transloadit || !file.transloadit.assembly) {
      return;
    }

    var state = this.getPluginState();
    var assembly = state.assemblies[file.transloadit.assembly];

    this.client.addFile(assembly, file).catch(function (err) {
      _this5.core.log(err);
      _this5.core.emit('transloadit:import-error', assembly, file.id, err);
    });
  };

  Transloadit.prototype.findFile = function findFile(uploadedFile) {
    var files = this.core.state.files;
    for (var id in files) {
      if (!files.hasOwnProperty(id)) {
        continue;
      }
      if (files[id].uploadURL === uploadedFile.tus_upload_url) {
        return files[id];
      }
    }
  };

  Transloadit.prototype.onFileUploadComplete = function onFileUploadComplete(assemblyId, uploadedFile) {
    var _extends4;

    var state = this.getPluginState();
    var file = this.findFile(uploadedFile);
    this.setPluginState({
      files: _extends({}, state.files, (_extends4 = {}, _extends4[uploadedFile.id] = {
        id: file.id,
        uploadedFile: uploadedFile
      }, _extends4))
    });
    this.core.emit('transloadit:upload', uploadedFile, this.getAssembly(assemblyId));
  };

  Transloadit.prototype.onResult = function onResult(assemblyId, stepName, result) {
    var state = this.getPluginState();
    var file = state.files[result.original_id];
    // The `file` may not exist if an import robot was used instead of a file upload.
    result.localId = file ? file.id : null;

    this.setPluginState({
      results: state.results.concat(result)
    });
    this.core.emit('transloadit:result', stepName, result, this.getAssembly(assemblyId));
  };

  Transloadit.prototype.onAssemblyFinished = function onAssemblyFinished(url) {
    var _this6 = this;

    this.client.getAssemblyStatus(url).then(function (assembly) {
      var _extends5;

      var state = _this6.getPluginState();
      _this6.setPluginState({
        assemblies: _extends({}, state.assemblies, (_extends5 = {}, _extends5[assembly.assembly_id] = assembly, _extends5))
      });
      _this6.core.emit('transloadit:complete', assembly);
    });
  };

  Transloadit.prototype.connectSocket = function connectSocket(assembly) {
    var _this7 = this;

    var socket = new StatusSocket(assembly.websocket_url, assembly);
    this.sockets[assembly.assembly_id] = socket;

    socket.on('upload', this.onFileUploadComplete.bind(this, assembly.assembly_id));
    socket.on('error', function (error) {
      _this7.core.emit('transloadit:assembly-error', assembly, error);
    });

    if (this.opts.waitForEncoding) {
      socket.on('result', this.onResult.bind(this, assembly.assembly_id));
    }

    if (this.opts.waitForEncoding) {
      socket.on('finished', function () {
        _this7.onAssemblyFinished(assembly.assembly_ssl_url);
      });
    } else if (this.opts.waitForMetadata) {
      socket.on('metadata', function () {
        _this7.onAssemblyFinished(assembly.assembly_ssl_url);
        _this7.core.emit('transloadit:complete', assembly);
      });
    }

    return new _Promise(function (resolve, reject) {
      socket.on('connect', resolve);
      socket.on('error', reject);
    }).then(function () {
      _this7.core.log('Transloadit: Socket is ready');
    });
  };

  Transloadit.prototype.prepareUpload = function prepareUpload(fileIDs, uploadID) {
    var _this8 = this,
        _extends6;

    fileIDs.forEach(function (fileID) {
      _this8.core.emit('core:preprocess-progress', fileID, {
        mode: 'indeterminate',
        message: _this8.i18n('creatingAssembly')
      });
    });

    var createAssembly = function createAssembly(_ref2) {
      var fileIDs = _ref2.fileIDs,
          options = _ref2.options;

      return _this8.createAssembly(fileIDs, uploadID, options).then(function (assembly) {
        if (_this8.opts.importFromUploadURLs) {
          return _this8.reserveFiles(assembly, fileIDs);
        }
      }).then(function () {
        fileIDs.forEach(function (fileID) {
          _this8.core.emit('core:preprocess-complete', fileID);
        });
      });
    };

    var state = this.getPluginState();
    var uploadsAssemblies = _extends({}, state.uploadsAssemblies, (_extends6 = {}, _extends6[uploadID] = [], _extends6));
    this.setPluginState({ uploadsAssemblies: uploadsAssemblies });

    var optionsPromise = void 0;
    if (fileIDs.length > 0) {
      optionsPromise = this.getAssemblyOptions(fileIDs).then(function (allOptions) {
        return _this8.dedupeAssemblyOptions(allOptions);
      });
    } else if (this.opts.alwaysRunAssembly) {
      optionsPromise = Promise.resolve(this.opts.getAssemblyOptions(null, this.opts)).then(function (options) {
        _this8.validateParams(options.params);
        return [{ fileIDs: fileIDs, options: options }];
      });
    } else {
      // If there are no files and we do not `alwaysRunAssembly`,
      // don't do anything.
      return Promise.resolve();
    }

    return optionsPromise.then(function (assemblies) {
      return Promise.all(assemblies.map(createAssembly));
    });
  };

  Transloadit.prototype.afterUpload = function afterUpload(fileIDs, uploadID) {
    var _this9 = this;

    var state = this.getPluginState();
    var assemblyIDs = state.uploadsAssemblies[uploadID];

    // If we don't have to wait for encoding metadata or results, we can close
    // the socket immediately and finish the upload.
    if (!this.shouldWait()) {
      assemblyIDs.forEach(function (assemblyID) {
        var socket = _this9.sockets[assemblyID];
        socket.close();
      });
      return Promise.resolve();
    }

    // If no assemblies were created for this upload, we also do not have to wait.
    // There's also no sockets or anything to close, so just return immediately.
    if (assemblyIDs.length === 0) {
      return Promise.resolve();
    }

    var finishedAssemblies = 0;

    return new _Promise(function (resolve, reject) {
      fileIDs.forEach(function (fileID) {
        _this9.core.emit('core:postprocess-progress', fileID, {
          mode: 'indeterminate',
          message: _this9.i18n('encoding')
        });
      });

      var onAssemblyFinished = function onAssemblyFinished(assembly) {
        // An assembly for a different upload just finished. We can ignore it.
        if (assemblyIDs.indexOf(assembly.assembly_id) === -1) {
          return;
        }

        // TODO set the `file.uploadURL` to a result?
        // We will probably need an option here so the plugin user can tell us
        // which result to pick…?

        var files = _this9.getAssemblyFiles(assembly.assembly_id);
        files.forEach(function (file) {
          _this9.core.emit('core:postprocess-complete', file.id);
        });

        finishedAssemblies += 1;
        if (finishedAssemblies === assemblyIDs.length) {
          // We're done, these listeners can be removed
          removeListeners();
          resolve();
        }
      };

      var onAssemblyError = function onAssemblyError(assembly, error) {
        // An assembly for a different upload just finished. We can ignore it.
        if (assemblyIDs.indexOf(assembly.assembly_id) === -1) {
          return;
        }

        // Clear postprocessing state for all our files.
        var files = _this9.getAssemblyFiles(assembly.assembly_id);
        files.forEach(function (file) {
          // TODO Maybe make a postprocess-error event here?
          _this9.core.emit('core:upload-error', file.id, error);

          _this9.core.emit('core:postprocess-complete', file.id);
        });

        // Should we remove the listeners here or should we keep handling finished
        // assemblies?
        // Doing this for now so that it's not possible to receive more postprocessing
        // events once the upload has failed.
        removeListeners();

        // Reject the `afterUpload()` promise.
        reject(error);
      };

      var onImportError = function onImportError(assembly, fileID, error) {
        if (assemblyIDs.indexOf(assembly.assembly_id) === -1) {
          return;
        }

        // Not sure if we should be doing something when it's just one file failing.
        // ATM, the only options are 1) ignoring or 2) failing the entire upload.
        // I think failing the upload is better than silently ignoring.
        // In the future we should maybe have a way to resolve uploads with some failures,
        // like returning an object with `{ successful, failed }` uploads.
        onAssemblyError(assembly, error);
      };

      var removeListeners = function removeListeners() {
        _this9.core.off('transloadit:complete', onAssemblyFinished);
        _this9.core.off('transloadit:assembly-error', onAssemblyError);
        _this9.core.off('transloadit:import-error', onImportError);
      };

      _this9.core.on('transloadit:complete', onAssemblyFinished);
      _this9.core.on('transloadit:assembly-error', onAssemblyError);
      _this9.core.on('transloadit:import-error', onImportError);
    }).then(function () {
      // Clean up uploadID → assemblyIDs, they're no longer going to be used anywhere.
      var state = _this9.getPluginState();
      var uploadsAssemblies = _extends({}, state.uploadsAssemblies);
      delete uploadsAssemblies[uploadID];
      _this9.setPluginState({ uploadsAssemblies: uploadsAssemblies });
    });
  };

  Transloadit.prototype.install = function install() {
    this.core.addPreProcessor(this.prepareUpload);
    this.core.addPostProcessor(this.afterUpload);

    if (this.opts.importFromUploadURLs) {
      this.core.on('core:upload-success', this.onFileUploadURLAvailable);
    }

    this.setPluginState({
      // Contains assembly status objects, indexed by their ID.
      assemblies: {},
      // Contains arrays of assembly IDs, indexed by the upload ID that they belong to.
      uploadsAssemblies: {},
      // Contains file data from Transloadit, indexed by their Transloadit-assigned ID.
      files: {},
      // Contains result data from Transloadit.
      results: []
    });
  };

  Transloadit.prototype.uninstall = function uninstall() {
    this.core.removePreProcessor(this.prepareUpload);
    this.core.removePostProcessor(this.afterUpload);

    if (this.opts.importFromUploadURLs) {
      this.core.off('core:upload-success', this.onFileUploadURLAvailable);
    }
  };

  Transloadit.prototype.getAssembly = function getAssembly(id) {
    var state = this.getPluginState();
    return state.assemblies[id];
  };

  Transloadit.prototype.getAssemblyFiles = function getAssemblyFiles(assemblyID) {
    var _this10 = this;

    var fileIDs = Object.keys(this.core.state.files);
    return fileIDs.map(function (fileID) {
      return _this10.core.getFile(fileID);
    }).filter(function (file) {
      return file && file.transloadit && file.transloadit.assembly === assemblyID;
    });
  };

  return Transloadit;
}(Plugin);
//# sourceMappingURL=index.js.map