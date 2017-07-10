import test from 'tape'
import Core from '../../src/core/Core'
import Transloadit from '../../src/plugins/Transloadit'

test('Transloadit: Throws errors if options are missing', (t) => {
  const uppy = new Core()

  t.throws(() => {
    uppy.use(Transloadit, { params: {} })
  }, /The `params\.auth\.key` option is required/)

  t.end()
})

test('Transloadit: Accepts a JSON string as `params` for signature authentication', (t) => {
  const uppy = new Core()

  t.throws(() => {
    uppy.use(Transloadit, {
      params: 'not json'
    })
  }, /The `params` option is a malformed JSON string/)

  t.throws(() => {
    uppy.use(Transloadit, {
      params: '{"template_id":"some template id string"}'
    })
  }, /The `params\.auth\.key` option is required/)
  t.doesNotThrow(() => {
    uppy.use(Transloadit, {
      params: '{"auth":{"key":"some auth key string"},"template_id":"some template id string"}'
    })
  }, /The `params\.auth\.key` option is required/)

  t.end()
})

test('Transloadit: Validates response from getAssemblyOptions()', (t) => {
  const uppy = new Core({ autoProceed: false })

  uppy.use(Transloadit, {
    getAssemblyOptions: (file) => {
      t.equal(file.name, 'testfile')
      return {
        params: '{"some":"json"}'
      }
    }
  })

  const data = Buffer.alloc(4000)
  data.size = data.byteLength
  uppy.addFile({
    name: 'testfile',
    data
  }).then(() => {
    uppy.upload().then(t.fail, (err) => {
      t.ok(/The `params\.auth\.key` option is required/.test(err.message), 'should reject invalid dynamic params')
      t.end()
    })
  }, t.fail)
})

test('Transloadit: Uses different assemblies for different params', (t) => {
  t.plan(5)

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
    t.equal(opts.params.steps.fake_step.data, files[i], `assembly for file ${files[i]}`)
    i++
    // Short-circuit upload
    return Promise.reject('short-circuit')
  }

  const data = Buffer.alloc(10)
  data.size = data.byteLength

  Promise.all([
    uppy.addFile({ name: 'a.png', data }),
    uppy.addFile({ name: 'b.png', data }),
    uppy.addFile({ name: 'c.png', data }),
    uppy.addFile({ name: 'd.png', data })
  ]).then(() => {
    uppy.upload().then(t.fail, () => {
      t.equal(i, 4, 'created 4 assemblies')
      t.end()
    })
  }, t.fail)
})

test('Transloadit: Should merge files with same parameters into one assembly', (t) => {
  t.plan(3)

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
    t.equal(opts.params.steps.fake_step.data, assembly.data, `assembly for files ${assembly.files.join(',')}`)
    i++
    // Short-circuit upload
    return Promise.reject('short-circuit')
  }

  const data = Buffer.alloc(10)
  data.size = data.byteLength
  const data2 = Buffer.alloc(20)
  data2.size = data2.byteLength

  Promise.all([
    uppy.addFile({ name: 'a.png', data }),
    uppy.addFile({ name: 'b.png', data }),
    uppy.addFile({ name: 'c.png', data }),
    uppy.addFile({ name: 'd.png', data: data2 })
  ]).then(() => {
    uppy.upload().then(t.fail, () => {
      t.equal(i, 2, 'created two assemblies')
      t.end()
    })
  }, t.fail)
})
