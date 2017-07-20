/**
 * A Barebones HTTP API client for Transloadit.
 */
module.exports = class Client {
  constructor (opts = {}) {
    this.apiUrl = 'https://api2.transloadit.com'
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
    data.append('tus_num_expected_upload_files', expectedFiles)

    return fetch(`${this.apiUrl}/assemblies`, {
      method: 'post',
      body: data
    }).then((response) => response.json()).then((assembly) => {
      if (assembly.error) {
        const error = new Error(assembly.message)
        error.code = assembly.error
        error.status = assembly
        throw error
      }

      return assembly
    })
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
