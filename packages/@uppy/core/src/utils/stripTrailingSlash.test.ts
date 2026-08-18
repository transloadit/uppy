import { describe, expect, it } from 'vitest'
import stripTrailingSlash from './stripTrailingSlash.js'

describe('stripTrailingSlash', () => {
  it('should leave urls without a trailing slash alone', () => {
    expect(stripTrailingSlash('https://foo.bar/companion')).toEqual(
      'https://foo.bar/companion',
    )
  })

  it('should strip any number of trailing slashes', () => {
    expect(stripTrailingSlash('https://foo.bar/companion/')).toEqual(
      'https://foo.bar/companion',
    )

    expect(stripTrailingSlash('https://foo.bar/companion///')).toEqual(
      'https://foo.bar/companion',
    )
  })
})
