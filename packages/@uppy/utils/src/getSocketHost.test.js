const getSocketHost = require('./getSocketHost')

describe('getSocketHost', () => {
  it('should get the host from the specified url', () => {
    expect(
        getSocketHost('https://foo.bar/a/b/cd?e=fghi&l=k&m=n')
      ).toEqual('ws://foo.bar/a/b/cd?e=fghi&l=k&m=n')
  })
})
