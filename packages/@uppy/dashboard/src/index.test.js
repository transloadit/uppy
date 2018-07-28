const Core = require('@uppy/core')
const DashboardPlugin = require('./index')
const StatusBarPlugin = require('@uppy/status-bar')
const GoogleDrivePlugin = require('@uppy/google-drive')

describe('Dashboard', () => {
  it('can safely be added together with the StatusBar without id conflicts', () => {
    const core = new Core()
    core.use(StatusBarPlugin)

    expect(() => {
      core.use(DashboardPlugin, { inline: false })
    }).not.toThrow()

    core.close()
  })

  it('works without any remote provider plugins', () => {
    const core = new Core()

    expect(() => {
      core.use(DashboardPlugin, {
        inline: true,
        target: 'body'
      })
    }).not.toThrow()

    core.close()
  })

  it('works when targeting remote provider plugins using `target`', () => {
    const core = new Core()
    expect(() => {
      core.use(DashboardPlugin, {
        inline: true,
        target: 'body'
      })
      core.use(GoogleDrivePlugin, { target: DashboardPlugin, serverUrl: 'https://fake.uppy.io/' })
    }).not.toThrow()

    core.close()
  })

  it('works when passing plugins in `plugins` array', () => {
    const core = new Core()
    core.use(GoogleDrivePlugin, { serverUrl: 'https://fake.uppy.io/' })

    expect(() => {
      core.use(DashboardPlugin, {
        inline: true,
        target: 'body',
        plugins: ['GoogleDrive']
      })
    }).not.toThrow()

    core.close()
  })
})
