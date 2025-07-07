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

test('LocaleStrings type works with partial strings (Dashboard locale bug fix)', async () => {
  // This test verifies that LocaleStrings accepts partial strings
  // and can be used in scenarios like Dashboard where only some locale keys are provided

  // Mock locale types similar to Dashboard + StatusBar scenario
  const dashboardLocale = {
    strings: {
      uploading: 'Uploading...',
      complete: 'Complete',
      cancel: 'Cancel',
    },
  }

  const statusBarLocale = {
    strings: {
      uploading: 'Uploading',
      complete: 'Complete',
      uploadFailed: 'Upload failed',
      paused: 'Paused',
      retry: 'Retry',
    },
  }

  // Test that LocaleStrings allows partial strings
  const partialDashboardLocale: LocaleStrings<typeof dashboardLocale> = {
    strings: {
      uploading: 'Custom uploading text',
      // Should not require 'complete' or 'cancel' to be present
    },
  }

  const partialStatusBarLocale: LocaleStrings<typeof statusBarLocale> = {
    strings: {
      uploading: 'Custom uploading text',
      complete: 'Custom complete text',
      // Should not require other StatusBar strings to be present
    },
  }

  // Verify the types work as expected
  expectTypeOf(partialDashboardLocale.strings.uploading).toEqualTypeOf<
    string | undefined
  >()
  expectTypeOf(partialStatusBarLocale.strings.uploading).toEqualTypeOf<
    string | undefined
  >()

  // Test that we can combine partial locales (the key use case from the bug report)
  type CombinedLocaleType = LocaleStrings<typeof dashboardLocale> &
    LocaleStrings<typeof statusBarLocale>

  // This should work without requiring all properties from both types
  const combinedPartialLocale: CombinedLocaleType = {
    strings: {
      uploading: 'Custom uploading text',
      // Should not require all strings from both dashboardLocale and statusBarLocale
    },
  }

  expectTypeOf(combinedPartialLocale.strings.uploading).toEqualTypeOf<
    string | undefined
  >()
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
