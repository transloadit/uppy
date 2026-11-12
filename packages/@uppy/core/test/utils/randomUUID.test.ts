import { afterEach, describe, expect, it, vi } from 'vitest'
import randomUUID from '../../lib/utils/randomUUID.js'

// RFC 4122 version 4: version nibble `4`, variant bits `10xx` (8, 9, a or b)
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

function expectUniqueV4UUIDs() {
  const uuids = Array.from({ length: 1000 }, () => randomUUID())
  for (const uuid of uuids) expect(uuid).toMatch(UUID_V4)
  expect(new Set(uuids).size).toBe(uuids.length)
}

describe('randomUUID', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns unique v4 UUIDs', () => {
    expectUniqueV4UUIDs()
  })

  it('uses crypto.randomUUID when available', () => {
    const spy = vi.spyOn(crypto, 'randomUUID')
    try {
      const uuid = randomUUID()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(uuid).toBe(spy.mock.results[0].value)
    } finally {
      spy.mockRestore()
    }
  })

  describe('without crypto.randomUUID (insecure context)', () => {
    function stubInsecureCrypto() {
      const getRandomValues = vi.fn(crypto.getRandomValues.bind(crypto))
      vi.stubGlobal('crypto', { getRandomValues })
      return getRandomValues
    }

    it('returns unique v4 UUIDs from crypto.getRandomValues', () => {
      const getRandomValues = stubInsecureCrypto()
      expectUniqueV4UUIDs()
      expect(getRandomValues).toHaveBeenCalled()
    })

    it('sets the version and variant bits regardless of the random bytes', () => {
      vi.stubGlobal('crypto', {
        getRandomValues: <T extends ArrayBufferView>(array: T) => {
          new Uint8Array(array.buffer).fill(0xff)
          return array
        },
      })
      expect(randomUUID()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff')

      vi.stubGlobal('crypto', {
        getRandomValues: <T extends ArrayBufferView>(array: T) => array,
      })
      expect(randomUUID()).toBe('00000000-0000-4000-8000-000000000000')
    })
  })
})
