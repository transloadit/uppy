import Uppy from '@uppy/core'
import Transloadit from '@uppy/transloadit'
import { describe, expect, it } from 'vitest'
import TransloaditStorage from '../lib/index.js'

const STORING = 'Storing…'

/**
 * Install both plugins the way `storeUploads` is meant to be used, optionally
 * applying a locale pack to the whole instance in between (which is when
 * `Uppy.setOptions` copies that pack into every plugin's own `opts.locale`).
 */
function install({
  transloaditLocale,
  instanceLocale,
}: {
  transloaditLocale?: { strings: Record<string, string> }
  instanceLocale?: { strings: Record<string, string> }
} = {}) {
  const uppy = new Uppy()
  uppy.use(Transloadit, {
    assemblyOptions: { params: { auth: { key: 'test' } } },
    ...(transloaditLocale && { locale: transloaditLocale }),
  })
  if (instanceLocale) uppy.setOptions({ locale: instanceLocale })
  uppy.use(TransloaditStorage, {
    workspace: 'workspace',
    companionUrl: 'http://localhost:3020',
    storeUploads: { template_id: 'template' },
  })
  return uppy.getPlugin('Transloadit')!
}

describe('storeUploads relabelling the Transloadit plugin', () => {
  it('overrides encoding and keeps the other strings the integrator set', () => {
    const transloadit = install({
      transloaditLocale: {
        strings: { creatingAssembly: 'Preparing your files' },
      },
    })

    expect(transloadit.i18n('encoding')).toBe(STORING)
    // Regression: `setOptions` merges one level deep, so replacing `locale`
    // wholesale used to drop this one.
    expect(transloadit.i18n('creatingAssembly')).toBe('Preparing your files')
  })

  it('keeps the relabel above an explicit encoding override', () => {
    const transloadit = install({
      transloaditLocale: { strings: { encoding: 'Transcoding…' } },
    })

    // The knob for this string is TransloaditStorage's own `storing`, so the
    // relabel still wins here, exactly as it did before the merge was added.
    expect(transloadit.i18n('encoding')).toBe(STORING)
  })

  it('survives a locale pack applied to the whole instance', () => {
    const transloadit = install({
      instanceLocale: { strings: { encoding: 'Encoding...' } },
    })

    expect(transloadit.i18n('encoding')).toBe(STORING)
  })
})
