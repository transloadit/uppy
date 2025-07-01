import type { LocaleStrings } from '@uppy/utils/lib/Translator'

import type { Body, InternalMetadata, Meta } from '@uppy/utils/lib/UppyFile'
import { expectTypeOf, test } from 'vitest'
import UIPlugin, { type UIPluginOptions } from './UIPlugin.js'
import Uppy, { type UnknownPlugin } from './Uppy.js'

interface Opts extends UIPluginOptions {
  foo: string
  locale?: LocaleStrings<{ strings: { bar: string; baz: string } }>
}
class TestPlugin<M extends Meta, B extends Body> extends UIPlugin<Opts, M, B> {
  constructor(uppy: Uppy<M, B>, opts?: Opts) {
    super(uppy, opts)
    this.id = 'TestPlugin'
    this.type = 'acquirer'
  }
}

test('can add locale strings without type error', async () => {
  new Uppy().use(TestPlugin, {
    foo: 'bar',
    locale: { strings: { bar: '' } },
  })
})

test('can use Uppy class without generics', async () => {
  const core = new Uppy()
  expectTypeOf(core).toEqualTypeOf<Uppy<Meta, Record<string, never>>>()
})

test('can .use() a plugin', async () => {
  const core = new Uppy().use(TestPlugin)
  expectTypeOf(core).toEqualTypeOf<Uppy<Meta, Record<string, never>>>()
})

test('can .getPlugin() with a generic', async () => {
  const core = new Uppy().use(TestPlugin)
  const plugin = core.getPlugin<TestPlugin<any, any>>('TestPlugin')
  const plugin2 = core.getPlugin('TestPlugin')
  expectTypeOf(plugin).toEqualTypeOf<TestPlugin<any, any> | undefined>()
  expectTypeOf(plugin2).toEqualTypeOf<
    // The default type
    | UnknownPlugin<Meta, Record<string, never>, Record<string, unknown>>
    | undefined
  >()
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
