import { expectError, expectType } from 'tsd'
import Uppy, { UIPlugin } from '../'
import type { UploadedUppyFile, FailedUppyFile, PluginOptions } from '../'
import DefaultStore from '@uppy/store-default'

{
  const uppy = new Uppy()
  uppy.addFile({
    data: new Blob([new ArrayBuffer(1024)], {
      type: 'application/octet-stream'
    })
  })

  uppy.upload().then((result) => {
    expectType<UploadedUppyFile<{}, {}>>(result.successful[0])
    expectType<FailedUppyFile<{}, {}>>(result.failed[0])
  })
}

{
  const store = DefaultStore()
  new Uppy({ store })
}

{
  const uppy = new Uppy()
  // this doesn't exist but type checking works anyway :)
  const f = uppy.getFile('virtual')
  if (f && f.progress && f.progress.uploadStarted === null) {
    f.progress.uploadStarted = Date.now()
  }

  if (f && f.response && f.response.status === 200) {
    expectType(f.response.body)
  }
  expectType<number>(f.response!.status)
}

{
  type Meta = {}
  type ResponseBody = {
    averageColor: string
  }
  const uppy = new Uppy()
  const f = uppy.getFile<Meta, ResponseBody>('virtual')!
  expectType<ResponseBody>(f.response!.body)
}

{
  const uppy = new Uppy()
  uppy.addFile({
    name: 'empty.json',
    data: new Blob(['null'], { type: 'application/json' }),
    meta: { path: 'path/to/file' }
  })
}

{
  interface SomeOptions extends PluginOptions {
    types: 'are checked'
  }
  class SomePlugin extends UIPlugin<SomeOptions> {}
  const typedUppy = new Uppy()

  expectError(typedUppy.use(SomePlugin, { types: 'error' }))

  typedUppy.use(SomePlugin, { types: 'are checked' })
}

{
  const uppy = new Uppy()
  // can emit events with internal event types
  uppy.emit('upload')
  uppy.emit('complete', () => {})
  uppy.emit('error', () => {})

  // can emit events with custom event types
  uppy.emit('dashboard:modal-closed', () => {})

  // can register listeners for internal events
  uppy.on('upload', () => {})
  uppy.on('complete', () => {})
  uppy.on('error', () => {})
  uppy.once('upload', () => {})
  uppy.once('complete', () => {})
  uppy.once('error', () => {})

  // can register listeners on custom events
  uppy.on('dashboard:modal-closed', () => {})
  uppy.once('dashboard:modal-closed', () => {})
}

{
  const uppy = new Uppy()
  uppy.setOptions({
    restrictions: {
      allowedFileTypes: ['.png']
    }
  })
  expectError(uppy.setOptions({ restrictions: false }))
  expectError(uppy.setOptions({ unknownKey: false }))
}

{
  interface TestOptions extends PluginOptions {
    testOption: string
  }
  class TestPlugin extends UIPlugin<TestOptions> {
  }

  const strict = new Uppy().use(TestPlugin, { testOption: 'hello' })

  strict.getPlugin<TestPlugin>('TestPlugin').setOptions({ testOption: 'world' })

  expectError(strict.getPlugin<TestPlugin>('TestPlugin').setOptions({ testOption: 0 }))

  expectError(strict.getPlugin<TestPlugin>('TestPlugin').setOptions({ unknownKey: false }))
}
