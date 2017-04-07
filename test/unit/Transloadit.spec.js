import test from 'tape'
import Core from '../../src/core/Core'
import Transloadit from '../../src/plugins/Transloadit'

test('Throws errors if options are missing', (t) => {
  const uppy = new Core()

  t.throws(() => {
    uppy.use(Transloadit, { key: null, templateId: 'abc' })
  }, 'The `key` option is required.')

  t.throws(() => {
    uppy.use(Transloadit, { key: 'abc', templateId: null })
  }, 'The `templateId` option is required.')

  t.end()
})
