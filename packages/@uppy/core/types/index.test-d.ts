/* eslint-disable @typescript-eslint/no-unused-vars */
import { expectError, expectType } from 'tsd'
import DefaultStore from '@uppy/store-default'
import Uppy, { UIPlugin } from '..'
import type { UploadedUppyFile, FailedUppyFile, PluginOptions, UppyFile, SuccessResponse } from '..'

type anyObject = Record<string, unknown>

{
  const uppy = new Uppy()
  uppy.addFile({
    data: new Blob([new ArrayBuffer(1024)], {
      type: 'application/octet-stream',
    }),
  })

  uppy.upload().then((result) => {
    expectType<UploadedUppyFile<anyObject, anyObject>>(result.successful[0])
    expectType<FailedUppyFile<anyObject, anyObject>>(result.failed[0])
  })
}

{
  const store = DefaultStore()
  new Uppy({ store }) // eslint-disable-line no-new
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
  expectType<number>(f.response!.status) // eslint-disable-line @typescript-eslint/no-non-null-assertion
}

{
  type Meta = Record<string, never>
  type ResponseBody = {
    averageColor: string
  }
  const uppy = new Uppy()
  const f = uppy.getFile<Meta, ResponseBody>('virtual')
  expectType<ResponseBody>(f.response!.body) // eslint-disable-line @typescript-eslint/no-non-null-assertion
}

{
  const uppy = new Uppy()
  uppy.addFile({
    name: 'empty.json',
    data: new Blob(['null'], { type: 'application/json' }),
    meta: { path: 'path/to/file' },
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
  /* eslint-disable @typescript-eslint/no-empty-function */
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
  /* eslint-enable @typescript-eslint/no-empty-function */

  // Normal event signature
  uppy.on('complete', (result) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const successResults = result.successful
  })

  // Meta signature
  type Meta = {myCustomMetadata: string}
  uppy.on<'complete', Meta>('complete', (result) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const meta = result.successful[0].meta.myCustomMetadata
  })

  // Separate event handlers
  const handleUpload = (file: UppyFile<Meta>) => {
    const meta = file.meta.myCustomMetadata
  }

  uppy.off<'upload-success', Meta>('upload-success', handleUpload)

  interface CustomResponse extends SuccessResponse {
    body?: { someValue: string }
  }

  const onUploadSuccess = async (file: UppyFile<Meta, any>, response: CustomResponse) => {
    const res = response.body?.someValue
  }
  uppy.on<'upload-success', Meta>('upload-success', onUploadSuccess)
}

{
  const uppy = new Uppy()
  uppy.setOptions({
    restrictions: {
      allowedFileTypes: ['.png'],
    },
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

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  strict.getPlugin<TestPlugin>('TestPlugin')!.setOptions({ testOption: 'world' })

  expectError(strict.getPlugin<TestPlugin>('TestPlugin')!.setOptions({ testOption: 0 }))

  expectError(strict.getPlugin<TestPlugin>('TestPlugin')!.setOptions({ unknownKey: false }))
  /* eslint-enable @typescript-eslint/no-non-null-assertion */
}
