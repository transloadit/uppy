import { describe, expect, it } from '@jest/globals'
import getSocketHost from './getSocketHost.js'

describe('getSocketHost', () => {
  it('should get the host from the specified url', () => {
    expect(
      getSocketHost('https://foo.bar/a/b/cd?e=fghi&l=k&m=n'),
    ).toEqual('wss://foo.bar/a/b/cd?e=fghi&l=k&m=n')

    expect(
      getSocketHost('Https://foo.bar/a/b/cd?e=fghi&l=k&m=n'),
    ).toEqual('wss://foo.bar/a/b/cd?e=fghi&l=k&m=n')

    expect(
      getSocketHost('foo.bar/a/b/cd?e=fghi&l=k&m=n'),
    ).toEqual('wss://foo.bar/a/b/cd?e=fghi&l=k&m=n')

    expect(
      getSocketHost('http://foo.bar/a/b/cd?e=fghi&l=k&m=n'),
    ).toEqual('ws://foo.bar/a/b/cd?e=fghi&l=k&m=n')
  })
})
