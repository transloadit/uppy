import type { Body, InternalMetadata, LocaleStrings, Meta } from '@uppy/utils'
import { expectTypeOf, test } from 'vitest'
import BasePlugin from './BasePlugin.js'
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

class TestRegistryPlugin<M extends Meta, B extends Body> extends BasePlugin<
  Record<string, never>,
  M,
  B
> {
  constructor(uppy: Uppy<M, B>) {
    super(uppy, {})
    this.id = 'TestRegistryPlugin'
    this.type = 'acquirer'
  }
}

// Augment the Type Registry with our test plugin
declare module './Uppy.js' {
  interface PluginTypeRegistry<M extends Meta, B extends Body> {
    TestRegistryPlugin: TestRegistryPlugin<M, B>
  }
}

test('Type Registry: getPlugin with registered plugin name returns correct type', () => {
  const uppy = new Uppy()
  uppy.use(TestRegistryPlugin)

  // When using a registered plugin name, TypeScript should infer the correct type from PluginTypeRegistry
  const plugin = uppy.getPlugin('TestRegistryPlugin')

  expectTypeOf(plugin).toEqualTypeOf<
    TestRegistryPlugin<Meta, Record<string, never>> | undefined
  >()
})

test('Type Registry: getPlugin with unregistered name returns UnknownPlugin', () => {
  const uppy = new Uppy()

  // When using a non-registered string, should return UnknownPlugin
  const plugin = uppy.getPlugin('SomeRandomPlugin')

  expectTypeOf(plugin).toEqualTypeOf<
    UnknownPlugin<Meta, Record<string, never>> | undefined
  >()
})

test('Type Registry: getPlugin with dynamic string returns UnknownPlugin', () => {
  const uppy = new Uppy()
  const pluginName: string = 'DynamicName'

  // Dynamic string should use the fallback overload unlike literal string
  const plugin = uppy.getPlugin(pluginName)

  expectTypeOf(plugin).toEqualTypeOf<
    UnknownPlugin<Meta, Record<string, never>> | undefined
  >()
})

test('Type Registry: works with custom Meta and Body types', () => {
  type CustomMeta = { userId: string; timestamp: number }
  type CustomBody = { encrypted: boolean }

  // With custom Meta and Body types
  const uppy = new Uppy<CustomMeta, CustomBody>()
  uppy.use(TestRegistryPlugin)

  const plugin = uppy.getPlugin('TestRegistryPlugin')

  expectTypeOf(plugin).toEqualTypeOf<
    TestRegistryPlugin<CustomMeta, CustomBody> | undefined
  >()
})
