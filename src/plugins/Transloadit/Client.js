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
      template_id: templateId,
      auth: { key: this.opts.key }
    })
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
