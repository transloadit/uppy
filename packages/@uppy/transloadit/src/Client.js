/**
 * A Barebones HTTP API client for Transloadit.
 */
module.exports = class Client {
  constructor (opts = {}) {
    this.opts = opts

    this._reportError = this._reportError.bind(this)
  }

  /**
   * Create a new assembly.
   *
   * @param {object} options
   */
  createAssembly ({
    templateId,
    params,
    fields,
    signature,
    expectedFiles
  }) {
    const data = new FormData()
    data.append('params', typeof params === 'string'
      ? params
      : JSON.stringify(params))
    if (signature) {
      data.append('signature', signature)
    }

    Object.keys(fields).forEach((key) => {
      data.append(key, fields[key])
    })
    data.append('num_expected_upload_files', expectedFiles)

    const url = `${this.opts.service}/assemblies`
    return fetch(url, {
      method: 'post',
      body: data
    }).then((response) => response.json()).then((assembly) => {
      if (assembly.error) {
        const error = new Error(assembly.error)
        error.message = assembly.error
        error.details = assembly.reason
        throw error
      }

      return assembly
    }).catch((err) => this._reportError(err, { url }))
  }

  /**
   * Reserve resources for a file in an Assembly. Then addFile can be used later.
   *
   * @param {object} assembly
   * @param {UppyFile} file
   */
  reserveFile (assembly, file) {
    const size = encodeURIComponent(file.size)
    const url = `${assembly.assembly_ssl_url}/reserve_file?size=${size}`
    return fetch(url, { method: 'post' })
      .then((response) => response.json())
      .catch((err) => this._reportError(err, { assembly, file, url }))
  }

  /**
   * Import a remote file to an Assembly.
   *
   * @param {object} assembly
   * @param {UppyFile} file
   */
  addFile (assembly, file) {
    if (!file.uploadURL) {
      return Promise.reject(new Error('File does not have an `uploadURL`.'))
    }
    const size = encodeURIComponent(file.size)
    const uploadUrl = encodeURIComponent(file.uploadURL)
    const filename = encodeURIComponent(file.name)
    const fieldname = 'file'

    const qs = `size=${size}&filename=${filename}&fieldname=${fieldname}&s3Url=${uploadUrl}`
    const url = `${assembly.assembly_ssl_url}/add_file?${qs}`
    return fetch(url, { method: 'post' })
      .then((response) => response.json())
      .catch((err) => this._reportError(err, { assembly, file, url }))
  }

  /**
   * Cancel a running Assembly.
   *
   * @param {object} assembly
   */
  cancelAssembly (assembly) {
    return fetch(assembly.assembly_ssl_url, { method: 'delete' })
      .then((response) => response.json())
  }

  /**
   * Get the current status for an assembly.
   *
   * @param {string} url The status endpoint of the assembly.
   */
  getAssemblyStatus (url) {
    return fetch(url)
      .then((response) => response.json())
      .catch((err) => this._reportError(err, { url }))
  }

  submitError (err, { endpoint, instance, assembly }) {
    const message = err.details
      ? `${err.message} (${err.details})`
      : err.message

    return fetch('https://status.transloadit.com/client_error', {
      method: 'post',
      body: JSON.stringify({
        endpoint,
        instance,
        assembly_id: assembly,
        agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        error: message
      })
    }).then((response) => response.json())
  }

  _reportError (err, params = {}) {
    if (this.opts.errorReporting === false) {
      throw err
    }

    const opts = {}
    if (params.assembly) {
      opts.assembly = params.assembly.assembly_id
      opts.instance = params.assembly.instance
    }
    if (params.url) {
      opts.endpoint = params.url
    }

    this.submitError(err, opts).catch((_) => {
      // not much we can do then is there
    })

    throw err
  }
}
