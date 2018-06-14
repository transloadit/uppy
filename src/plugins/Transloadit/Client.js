/**
 * A Barebones HTTP API client for Transloadit.
 */
module.exports = class Client {
  constructor (opts = {}) {
    this.opts = opts
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

    return fetch(`${this.opts.service}/assemblies`, {
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
    })
  }

  reserveFile (assembly, file) {
    const size = encodeURIComponent(file.size)
    return fetch(`${assembly.assembly_ssl_url}/reserve_file?size=${size}`, { method: 'post' })
      .then((response) => response.json())
  }

  addFile (assembly, file) {
    if (!file.uploadURL) {
      return Promise.reject(new Error('File does not have an `uploadURL`.'))
    }
    const size = encodeURIComponent(file.size)
    const url = encodeURIComponent(file.uploadURL)
    const filename = encodeURIComponent(file.name)
    const fieldname = 'file'

    const qs = `size=${size}&filename=${filename}&fieldname=${fieldname}&s3Url=${url}`
    return fetch(`${assembly.assembly_ssl_url}/add_file?${qs}`, { method: 'post' })
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
  }
}
