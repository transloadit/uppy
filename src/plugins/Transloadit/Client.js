module.exports = class Client {
  constructor (opts) {
    this.apiUrl = 'https://api2.transloadit.com'
    this.opts = opts
  }

  /**
   * Create a new assembly.
   *
   * @param {object} options
   */
  createAssembly ({ templateId, params, expectedFiles }) {
    const data = new FormData()
    const finalParams = Object.assign({}, params, {
      // `params.auth` may already be specified, especially if signature
      // authentication is used. In that case we use it.
      // TODO this logic is the inverse of what happens in the `new Client` in
      // index.js. There, `opts.key` is preferred to `params.auth.key`. It
      // should perhaps `throw` instead if both are given.
      auth: params.auth || { key: this.opts.key }
    })
    if (templateId) {
      finalParams.template_id = templateId
    }
    data.append('params', JSON.stringify(finalParams))
    data.append('fields', JSON.stringify({
      // Nothing yet.
    }))
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

      return this.getAssemblyStatus(assembly.status_endpoint)
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
