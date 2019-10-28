const Core = require('@uppy/core')
const Transloadit = require('./')

describe('Transloadit', () => {
  it('Throws errors if options are missing', () => {
    const uppy = new Core()

    expect(() => {
      uppy.use(Transloadit, { params: {} })
    }).toThrowError(/The `params\.auth\.key` option is required/)
  })

  it('Accepts a JSON string as `params` for signature authentication', () => {
    const uppy = new Core()

    expect(() => {
      uppy.use(Transloadit, {
        params: 'not json'
      })
    }).toThrowError(/The `params` option is a malformed JSON string/)

    expect(() => {
      uppy.use(Transloadit, {
        params: '{"template_id":"some template id string"}'
      })
    }).toThrowError(/The `params\.auth\.key` option is required/)
    expect(() => {
      uppy.use(Transloadit, {
        params: '{"auth":{"key":"some auth key string"},"template_id":"some template id string"}'
      })
    }).not.toThrowError(/The `params\.auth\.key` option is required/)
  })

  it('Does not leave lingering progress if getAssemblyOptions fails', () => {
    const uppy = new Core()
    uppy.use(Transloadit, {
      getAssemblyOptions (file) {
        return Promise.reject(new Error('Failure!'))
      }
    })

    uppy.addFile({
      source: 'jest',
      name: 'abc',
      data: new Uint8Array(100)
    })

    return uppy.upload().then(() => {
      throw new Error('Should not have succeeded')
    }, (err) => {
      const fileID = Object.keys(uppy.getState().files)[0]

      expect(err.message).toBe('Failure!')
      expect(uppy.getFile(fileID).progress.uploadStarted).toBe(null)
    })
  })

  it('Does not leave lingering progress if creating assembly fails', () => {
    const uppy = new Core()
    uppy.use(Transloadit, {
      params: {
        auth: { key: 'some auth key string' },
        template_id: 'some template id string'
      }
    })

    uppy.getPlugin('Transloadit').client.createAssembly = () =>
      Promise.reject(new Error('VIDEO_ENCODE_VALIDATION'))

    uppy.addFile({
      source: 'jest',
      name: 'abc',
      data: new Uint8Array(100)
    })

    return uppy.upload().then(() => {
      throw new Error('Should not have succeeded')
    }, (err) => {
      const fileID = Object.keys(uppy.getState().files)[0]

      expect(err.message).toBe('Transloadit: Could not create Assembly: VIDEO_ENCODE_VALIDATION')
      expect(uppy.getFile(fileID).progress.uploadStarted).toBe(null)
    })
  })
})
