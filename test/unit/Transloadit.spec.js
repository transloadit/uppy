import test from 'tape'
import Core from '../../src/core/Core'
import Transloadit from '../../src/plugins/Transloadit'

test('Transloadit: Throws errors if options are missing', (t) => {
  const uppy = new Core()

  t.throws(() => {
    uppy.use(Transloadit, {})
  }, /The `params` option is required/)

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
