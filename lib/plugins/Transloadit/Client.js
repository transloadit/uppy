'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * A Barebones HTTP API client for Transloadit.
 */
module.exports = function () {
  function Client() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Client);

    this.apiUrl = 'https://api2.transloadit.com';
    this.opts = opts;
  }

  /**
   * Create a new assembly.
   *
   * @param {object} options
   */


  Client.prototype.createAssembly = function createAssembly(_ref) {
    var templateId = _ref.templateId,
        params = _ref.params,
        fields = _ref.fields,
        signature = _ref.signature,
        expectedFiles = _ref.expectedFiles;

    var data = new FormData();
    data.append('params', typeof params === 'string' ? params : JSON.stringify(params));
    if (signature) {
      data.append('signature', signature);
    }

    Object.keys(fields).forEach(function (key) {
      data.append(key, fields[key]);
    });
    data.append('num_expected_upload_files', expectedFiles);

    return fetch(this.apiUrl + '/assemblies', {
      method: 'post',
      body: data
    }).then(function (response) {
      return response.json();
    }).then(function (assembly) {
      if (assembly.error) {
        var error = new Error(assembly.message);
        error.code = assembly.error;
        error.status = assembly;
        throw error;
      }

      return assembly;
    });
  };

  Client.prototype.reserveFile = function reserveFile(assembly, file) {
    var size = encodeURIComponent(file.size);
    return fetch(assembly.assembly_ssl_url + '/reserve_file?size=' + size, { method: 'post' }).then(function (response) {
      return response.json();
    });
  };

  Client.prototype.addFile = function addFile(assembly, file) {
    if (!file.uploadURL) {
      return Promise.reject(new Error('File does not have an `uploadURL`.'));
    }
    var size = encodeURIComponent(file.size);
    var url = encodeURIComponent(file.uploadURL);
    var filename = encodeURIComponent(file.name);
    var fieldname = 'file';

    var qs = 'size=' + size + '&filename=' + filename + '&fieldname=' + fieldname + '&s3Url=' + url;
    return fetch(assembly.assembly_ssl_url + '/add_file?' + qs, { method: 'post' }).then(function (response) {
      return response.json();
    });
  };

  /**
   * Get the current status for an assembly.
   *
   * @param {string} url The status endpoint of the assembly.
   */


  Client.prototype.getAssemblyStatus = function getAssemblyStatus(url) {
    return fetch(url).then(function (response) {
      return response.json();
    });
  };

  return Client;
}();
//# sourceMappingURL=Client.js.map