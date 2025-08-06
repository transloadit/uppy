import { describe, expect, it } from 'vitest'
import getAllowedHosts, { isOriginAllowed } from './getAllowedHosts.js'

describe('getAllowedHosts', () => {
  it('can convert companionAllowedHosts', () => {
    expect(getAllowedHosts('www.example.com', '')).toBe('www.example.com')
    expect(
      getAllowedHosts([/transloadit\.com/, 'www\\.example\\.com'], ''),
    ).toEqual([/transloadit\.com/, 'www\\.example\\.com'])
    expect(() => getAllowedHosts(['['], '')).toThrow(
      /^Invalid regular expression/,
    )
  })

  it('can convert when companionAllowedHosts unset', () => {
    expect(getAllowedHosts(undefined, 'http://server.com')).toBe(
      'http:\\/\\/server\\.com',
    )
    expect(getAllowedHosts(undefined, 'https://server.com/')).toBe(
      'https:\\/\\/server\\.com',
    )
    expect(getAllowedHosts(undefined, 'server.com')).toBe(
      'https:\\/\\/server\\.com',
    )
    expect(getAllowedHosts(undefined, 'server.com/test')).toBe(
      'https:\\/\\/server\\.com',
    )
    expect(getAllowedHosts(undefined, '//server.com:80/test')).toBe(
      'https:\\/\\/server\\.com:80',
    )
  })
})

describe('isOriginAllowed', () => {
  it('should check origin', () => {
    expect(isOriginAllowed('a', [/^.+$/])).toBeTruthy()
    expect(isOriginAllowed('a', ['^.+$'])).toBeTruthy()
    expect(
      isOriginAllowed('www.transloadit.com', ['www\\.transloadit\\.com']),
    ).toBeTruthy()
    expect(
      isOriginAllowed('www.transloadit.com', ['transloadit\\.com']),
    ).toBeFalsy()
    expect(isOriginAllowed('match', ['fail', 'match'])).toBeTruthy()
    // todo maybe next major:
    // expect(isOriginAllowed('www.transloadit.com', ['\\.transloadit\\.com$'])).toBeTruthy()
  })
})
