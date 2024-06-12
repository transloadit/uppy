import { expectTypeOf, test } from 'vitest'

import type { Body, InternalMetadata, Meta } from '@uppy/utils/lib/UppyFile'
import Uppy from './Uppy'
import UIPlugin, { type UIPluginOptions } from './UIPlugin'

interface Opts extends UIPluginOptions {
  foo: string
}
class TestPlugin<M extends Meta, B extends Body> extends UIPlugin<Opts, M, B> {
  constructor(uppy: Uppy<M, B>, opts?: Opts) {
    super(uppy, opts)
    this.id = 'TestPlugin'
    this.type = 'acquirer'
  }
}

test('can use Uppy class without generics', async () => {
  const core = new Uppy()
  expectTypeOf(core).toEqualTypeOf<Uppy<Meta, Record<string, never>>>()
})

test('can .use() a plugin', async () => {
  const core = new Uppy().use(TestPlugin)
  expectTypeOf(core).toEqualTypeOf<Uppy<Meta, Record<string, never>>>()
})

test('Meta and Body generic move through the Uppy class', async () => {
  type M = { foo: string }
  type B = { bar: string }
  const core = new Uppy<M, B>()

  core.addUploader(() => Promise.resolve())

  core.on('complete', (result) => {
    expectTypeOf(result.successful?.[0]?.response?.body).toEqualTypeOf<
      B | undefined
    >()
  })

  const id = core.addFile({
    source: 'vi',
    name: 'foo.jpg',
    type: 'image/jpeg',
    data: new Blob(),
  })

  expectTypeOf(core.getFile(id).meta).toEqualTypeOf<InternalMetadata & M>()

  await core.upload()
})
