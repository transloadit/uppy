import { network } from 'virtual:msw'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import Provider from '../../lib/companion-client/Provider.js'
import Uppy from '../../lib/index.js'
import handleError from '../../lib/provider-views/utils/handleError.js'

network.configure({ context: { quiet: true } })
await network.enable()

afterEach(() => network.resetHandlers())

describe('Provider', () => {
  it('shows an unreachable Companion before a third-party login', async () => {
    using uppy = new Uppy({ logger: { debug() {}, warn() {}, error() {} } })
    const provider = new Provider(uppy, {
      companionUrl: 'http://companion.test',
      provider: 'dropbox',
      pluginId: 'Dropbox',
      companionKeysParams: { key: 'key', credentialsName: 'name' },
    })
    network.use(
      http.post('http://companion.test/dropbox/preauth/', () =>
        HttpResponse.error(),
      ),
    )

    await provider.ensurePreAuth().catch(handleError(uppy))
    expect(
      uppy
        .getState()
        .info.map(({ message, details }) => ({ message, details })),
    ).toEqual([{ message: 'Connection with Companion failed', details: null }])
  })
})
