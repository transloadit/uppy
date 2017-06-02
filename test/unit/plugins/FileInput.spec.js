import test from 'tape'
import FileInput from '../../../src/plugins/FileInput'

test('FileInput plugin: options', function (t) {
  let fi = new FileInput()
  t.equal(fi.opts.inputName, 'files[]', 'inputName defaults to files[]')

  fi = new FileInput(null, { inputName: 'upload' })
  t.equal(fi.opts.inputName, 'upload', 'inputName can be overridden')

  t.end()
})
