'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Plugin = require('../Plugin');
var Translator = require('../../core/Translator');
var XHRUpload = require('../XHRUpload');

module.exports = function (_Plugin) {
  _inherits(AwsS3, _Plugin);

  function AwsS3(core, opts) {
    _classCallCheck(this, AwsS3);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, core, opts));

    _this.type = 'uploader';
    _this.id = 'AwsS3';
    _this.title = 'AWS S3';

    var defaultLocale = {
      strings: {
        preparingUpload: 'Preparing upload...'
      }
    };

    var defaultOptions = {
      getUploadParameters: _this.getUploadParameters.bind(_this),
      locale: defaultLocale
    };

    _this.opts = _extends({}, defaultOptions, opts);
    _this.locale = _extends({}, defaultLocale, _this.opts.locale);
    _this.locale.strings = _extends({}, defaultLocale.strings, _this.opts.locale.strings);

    _this.translator = new Translator({ locale: _this.locale });
    _this.i18n = _this.translator.translate.bind(_this.translator);

    _this.prepareUpload = _this.prepareUpload.bind(_this);
    return _this;
  }

  AwsS3.prototype.getUploadParameters = function getUploadParameters(file) {
    if (!this.opts.host) {
      throw new Error('Expected a `host` option containing an uppy-server address.');
    }

    var filename = encodeURIComponent(file.name);
    var type = encodeURIComponent(file.type);
    return fetch(this.opts.host + '/s3/params?filename=' + filename + '&type=' + type, {
      method: 'get',
      headers: { accept: 'application/json' }
    }).then(function (response) {
      return response.json();
    });
  };

  AwsS3.prototype.prepareUpload = function prepareUpload(fileIDs) {
    var _this2 = this;

    fileIDs.forEach(function (id) {
      _this2.core.emit('core:preprocess-progress', id, {
        mode: 'determinate',
        message: _this2.i18n('preparingUpload'),
        value: 0
      });
    });

    return Promise.all(fileIDs.map(function (id) {
      var file = _this2.core.getFile(id);
      var paramsPromise = Promise.resolve().then(function () {
        return _this2.opts.getUploadParameters(file);
      });
      return paramsPromise.then(function (params) {
        _this2.core.emit('core:preprocess-progress', file.id, {
          mode: 'determinate',
          message: _this2.i18n('preparingUpload'),
          value: 1
        });
        return params;
      }).catch(function (error) {
        _this2.core.emit('core:upload-error', file.id, error);
      });
    })).then(function (responses) {
      var updatedFiles = {};
      fileIDs.forEach(function (id, index) {
        var file = _this2.core.getFile(id);
        if (file.error) {
          return;
        }

        var _responses$index = responses[index],
            _responses$index$meth = _responses$index.method,
            method = _responses$index$meth === undefined ? 'post' : _responses$index$meth,
            url = _responses$index.url,
            fields = _responses$index.fields,
            headers = _responses$index.headers;

        var xhrOpts = {
          method: method,
          formData: method.toLowerCase() === 'post',
          endpoint: url,
          metaFields: Object.keys(fields)
        };

        if (headers) {
          xhrOpts.headers = headers;
        }

        var updatedFile = _extends({}, file, {
          meta: _extends({}, file.meta, fields),
          xhrUpload: xhrOpts
        });

        updatedFiles[id] = updatedFile;
      });

      _this2.core.setState({
        files: _extends({}, _this2.core.getState().files, updatedFiles)
      });

      fileIDs.forEach(function (id) {
        _this2.core.emit('core:preprocess-complete', id);
      });
    });
  };

  AwsS3.prototype.install = function install() {
    this.core.addPreProcessor(this.prepareUpload);

    this.core.use(XHRUpload, {
      fieldName: 'file',
      responseUrlFieldName: 'location',
      getResponseData: function getResponseData(xhr) {
        // If no response, we've hopefully done a PUT request to the file
        // in the bucket on its full URL.
        if (!xhr.responseXML) {
          return { location: xhr.responseURL };
        }
        function getValue(key) {
          var el = xhr.responseXML.querySelector(key);
          return el ? el.textContent : '';
        }
        return {
          location: getValue('Location'),
          bucket: getValue('Bucket'),
          key: getValue('Key'),
          etag: getValue('ETag')
        };
      },
      getResponseError: function getResponseError(xhr) {
        // If no response, we don't have a specific error message, use the default.
        if (!xhr.responseXML) {
          return;
        }
        var error = xhr.responseXML.querySelector('Error > Message');
        return new Error(error.textContent);
      }
    });
  };

  AwsS3.prototype.uninstall = function uninstall() {
    var uploader = this.core.getPlugin('XHRUpload');
    this.core.removePlugin(uploader);

    this.core.removePreProcessor(this.prepareUpload);
  };

  return AwsS3;
}(Plugin);
//# sourceMappingURL=index.js.map