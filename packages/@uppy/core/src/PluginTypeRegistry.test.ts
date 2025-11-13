import type { Body, Meta } from '@uppy/utils'
import { expectTypeOf, test } from 'vitest'
import BasePlugin from './BasePlugin.js'
import Uppy, { type UnknownPlugin } from './Uppy.js'

// Create a test plugin that registers itself in the Type Registry
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

test('Type Registry: runtime getPlugin returns correct instance', () => {
  const uppy = new Uppy()
  uppy.use(TestRegistryPlugin)

  const plugin = uppy.getPlugin('TestRegistryPlugin')

  // Runtime checks
  if (!plugin) {
    throw new Error('Plugin should exist')
  }

  expectTypeOf(plugin.id).toBeString()
  expectTypeOf(plugin.type).toBeString()

  // Verify it's actually the correct plugin instance
  if (plugin.id !== 'TestRegistryPlugin') {
    throw new Error(
      `Expected plugin id to be 'TestRegistryPlugin', got '${plugin.id}'`,
    )
  }

  if (plugin.type !== 'acquirer') {
    throw new Error(
      `Expected plugin type to be 'acquirer', got '${plugin.type}'`,
    )
  }
})

test('Type Registry: returns undefined for non-existent plugin', () => {
  const uppy = new Uppy()

  const plugin = uppy.getPlugin('NonExistentPlugin')

  // Runtime check: Should be undefined
  if (plugin !== undefined) {
    throw new Error('Plugin should be undefined')
  }
})
