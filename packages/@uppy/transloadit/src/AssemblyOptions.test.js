const AssemblyOptions = require('./AssemblyOptions')

describe('Transloadit/AssemblyOptions', () => {
  it('Validates response from getAssemblyOptions()', async () => {
    const options = new AssemblyOptions([
      { name: 'testfile' }
    ], {
      getAssemblyOptions: (file) => {
        expect(file.name).toBe('testfile')
        return {
          params: '{"some":"json"}'
        }
      }
    })

    await expect(options.build()).rejects.toThrow(
      /The `params\.auth\.key` option is required/
    )
  })

  it('Uses different assemblies for different params', async () => {
    const data = Buffer.alloc(10)
    data.size = data.byteLength

    const options = new AssemblyOptions([
      { name: 'a.png', data },
      { name: 'b.png', data },
      { name: 'c.png', data },
      { name: 'd.png', data }
    ], {
      getAssemblyOptions: (file) => ({
        params: {
          auth: { key: 'fake key' },
          steps: {
            fake_step: { data: file.name }
          }
        }
      })
    })

    const assemblies = await options.build()
    expect(assemblies).toHaveLength(4)
    expect(assemblies[0].options.params.steps.fake_step.data).toBe('a.png')
    expect(assemblies[1].options.params.steps.fake_step.data).toBe('b.png')
    expect(assemblies[2].options.params.steps.fake_step.data).toBe('c.png')
    expect(assemblies[3].options.params.steps.fake_step.data).toBe('d.png')
  })

  it('Should merge files with same parameters into one Assembly', async () => {
    const data = Buffer.alloc(10)
    const data2 = Buffer.alloc(20)

    const options = new AssemblyOptions([
      { name: 'a.png', data, size: data.byteLength },
      { name: 'b.png', data, size: data.byteLength },
      { name: 'c.png', data, size: data.byteLength },
      { name: 'd.png', data: data2, size: data2.byteLength }
    ], {
      getAssemblyOptions: (file) => ({
        params: {
          auth: { key: 'fake key' },
          steps: {
            fake_step: { data: file.size }
          }
        }
      })
    })

    const assemblies = await options.build()
    expect(assemblies).toHaveLength(2)
    expect(assemblies[0].fileIDs).toHaveLength(3)
    expect(assemblies[1].fileIDs).toHaveLength(1)
    expect(assemblies[0].options.params.steps.fake_step.data).toBe(10)
    expect(assemblies[1].options.params.steps.fake_step.data).toBe(20)
  })

  it('Does not create an Assembly if no files are being uploaded', async () => {
    const options = new AssemblyOptions([], {
      getAssemblyOptions () {
        throw new Error('should not create Assembly')
      }
    })

    await expect(options.build()).resolves.toEqual([])
  })

  it('Creates an Assembly if no files are being uploaded but `alwaysRunAssembly` is enabled', async () => {
    const options = new AssemblyOptions([], {
      alwaysRunAssembly: true,
      getAssemblyOptions (file) {
        expect(file).toBe(null)
        return {
          params: {
            auth: { key: 'fake key' },
            template_id: 'example'
          }
        }
      }
    })

    await expect(options.build()).resolves.toHaveLength(1)
  })

  it('Collects metadata if `fields` is an array', async () => {
    function defaultGetAssemblyOptions (file, options) {
      return {
        params: options.params,
        signature: options.signature,
        fields: options.fields
      }
    }

    const options = new AssemblyOptions([{
      id: 1,
      meta: { watermark: 'Some text' }
    }, {
      id: 2,
      meta: { watermark: 'ⓒ Transloadit GmbH' }
    }], {
      fields: ['watermark'],
      params: {
        auth: { key: 'fake key' }
      },
      getAssemblyOptions: defaultGetAssemblyOptions
    })

    const assemblies = await options.build()
    expect(assemblies).toHaveLength(2)
    expect(assemblies[0].options.fields).toMatchObject({
      watermark: 'Some text'
    })
    expect(assemblies[1].options.fields).toMatchObject({
      watermark: 'ⓒ Transloadit GmbH'
    })
  })
})
