const Core = require('../../core')
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

  it('Validates response from getAssemblyOptions()', () => {
    const uppy = new Core({ autoProceed: false })

    uppy.use(Transloadit, {
      getAssemblyOptions: (file) => {
        expect(file.name).toBe('testfile')
        return {
          params: '{"some":"json"}'
        }
      }
    })

    const data = Buffer.alloc(4000)
    data.size = data.byteLength
    return uppy.addFile({
      name: 'testfile',
      data
    }).then(() => {
      return uppy.upload().then(() => {
        throw new Error('should have rejected')
      }, (err) => {
        expect(err.message).toMatch(/The `params\.auth\.key` option is required/)
      })
    })
  })

  it('Uses different assemblies for different params', () => {
    const uppy = new Core({ autoProceed: false })

    uppy.use(Transloadit, {
      getAssemblyOptions: (file) => ({
        params: {
          auth: { key: 'fake key' },
          steps: {
            fake_step: { data: file.name }
          }
        }
      })
    })

    const tl = uppy.getPlugin('Transloadit')
    const files = ['a.png', 'b.png', 'c.png', 'd.png']
    let i = 0
    tl.client.createAssembly = (opts) => {
      expect(opts.params.steps.fake_step.data).toEqual(files[i])
      i++
      // Short-circuit upload
      return Promise.reject('short-circuit') // eslint-disable-line prefer-promise-reject-errors
    }

    const data = Buffer.alloc(10)
    data.size = data.byteLength

    return Promise.all([
      uppy.addFile({ name: 'a.png', data }),
      uppy.addFile({ name: 'b.png', data }),
      uppy.addFile({ name: 'c.png', data }),
      uppy.addFile({ name: 'd.png', data })
    ]).then(() => {
      return uppy.upload().then(() => {
        throw new Error('upload should have been rejected')
      }, () => {
        expect(i).toBe(4)
      })
    })
  })

  it('Should merge files with same parameters into one assembly', () => {
    const uppy = new Core({ autoProceed: false })

    uppy.use(Transloadit, {
      getAssemblyOptions: (file) => ({
        params: {
          auth: { key: 'fake key' },
          steps: {
            fake_step: { data: file.size }
          }
        }
      })
    })

    const tl = uppy.getPlugin('Transloadit')
    const assemblies = [
      { data: 10, files: ['a.png', 'b.png', 'c.png'] },
      { data: 20, files: ['d.png'] }
    ]
    let i = 0
    tl.client.createAssembly = (opts) => {
      const assembly = assemblies[i]
      expect(opts.params.steps.fake_step.data).toBe(assembly.data)
      i++
      // Short-circuit upload
      return Promise.reject('short-circuit') // eslint-disable-line prefer-promise-reject-errors
    }

    const data = Buffer.alloc(10)
    data.size = data.byteLength
    const data2 = Buffer.alloc(20)
    data2.size = data2.byteLength

    return Promise.all([
      uppy.addFile({ name: 'a.png', data }),
      uppy.addFile({ name: 'b.png', data }),
      uppy.addFile({ name: 'c.png', data }),
      uppy.addFile({ name: 'd.png', data: data2 })
    ]).then(() => {
      return uppy.upload().then(() => {
        throw new Error('Upload should have been rejected')
      }, () => {
        expect(i).toBe(2)
      })
    })
  })

  it('Does not create an assembly if no files are being uploaded', () => {
    const uppy = new Core()
    uppy.use(Transloadit, {
      getAssemblyOptions () {
        throw new Error('should not create assembly')
      }
    })
    uppy.run()

    return uppy.upload()
  })

  it('Creates an assembly if no files are being uploaded but `alwaysRunAssembly` is enabled', () => {
    const uppy = new Core()
    uppy.use(Transloadit, {
      alwaysRunAssembly: true,
      getAssemblyOptions (file) {
        // should call getAssemblyOptions with `null`
        expect(file).toBe(null)
        return Promise.reject('short-circuited') // eslint-disable-line prefer-promise-reject-errors
      }
    })

    return expect(uppy.upload()).rejects.toBe('short-circuited')
  })
})
