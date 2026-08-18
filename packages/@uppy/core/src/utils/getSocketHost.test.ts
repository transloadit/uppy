import { describe, expect, it } from 'vitest'
import getSocketHost from './getSocketHost.js'

describe('getSocketHost', () => {
  it('should get the host from the specified url', () => {
    expect(getSocketHost('https://foo.bar/a/b/cd?e=fghi&l=k&m=n')).toEqual(
      'wss://foo.bar/a/b/cd?e=fghi&l=k&m=n',
    )

    expect(getSocketHost('https://www.foo.bar/a/b/cd?e=fghi&l=k&m=n')).toEqual(
      'wss://www.foo.bar/a/b/cd?e=fghi&l=k&m=n',
    )

    expect(getSocketHost('Https://foo.bar/a/b/cd?e=fghi&l=k&m=n')).toEqual(
      'wss://foo.bar/a/b/cd?e=fghi&l=k&m=n',
    )

    expect(getSocketHost('foo.bar/a/b/cd?e=fghi&l=k&m=n')).toEqual(
      'wss://foo.bar/a/b/cd?e=fghi&l=k&m=n',
    )

    expect(getSocketHost('http://foo.bar/a/b/cd?e=fghi&l=k&m=n')).toEqual(
      'ws://foo.bar/a/b/cd?e=fghi&l=k&m=n',
    )
  })

  it('should strip trailing slashes so appended paths do not double up', () => {
    expect(getSocketHost('http://localhost:3020/')).toEqual(
      'ws://localhost:3020',
    )

    expect(getSocketHost('https://foo.bar/companion/')).toEqual(
      'wss://foo.bar/companion',
    )

    expect(getSocketHost('https://foo.bar/companion///')).toEqual(
      'wss://foo.bar/companion',
    )
  })
})
