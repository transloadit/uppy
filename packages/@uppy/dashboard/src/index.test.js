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
      core.use(GoogleDrivePlugin, { target: DashboardPlugin, companionUrl: 'https://fake.uppy.io/' })
    }).not.toThrow()

    core.close()
  })

  it('works when passing plugins in `plugins` array', () => {
    const core = new Core()
    core.use(GoogleDrivePlugin, { companionUrl: 'https://fake.uppy.io/' })

    expect(() => {
      core.use(DashboardPlugin, {
        inline: true,
        target: 'body',
        plugins: ['GoogleDrive']
      })
    }).not.toThrow()

    core.close()
  })

  it('should change options on the fly', () => {
    const core = new Core()
    core.use(DashboardPlugin, {
      inline: true,
      target: 'body'
    })

    core.getPlugin('Dashboard').setOptions({
      width: 300
    })

    expect(
      core.getPlugin('Dashboard').opts.width
    ).toEqual(300)
  })

  it('should use updated locale from Core, when it’s set via Core’s setOptions()', () => {
    const core = new Core()
    core.use(DashboardPlugin, {
      inline: true,
      target: 'body'
    })

    core.setOptions({
      locale: {
        strings: {
          myDevice: 'Май дивайс'
        }
      }
    })

    expect(
      core.getPlugin('Dashboard').i18n('myDevice')
    ).toEqual('Май дивайс')
  })
})
