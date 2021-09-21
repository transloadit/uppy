const h = require('react').createElement
const { mount, configure } = require('enzyme')
const ReactAdapter = require('enzyme-adapter-react-16')
const Uppy = require('@uppy/core')

jest.mock('@uppy/dashboard', () => require('./__mocks__/DashboardPlugin'))

const DashboardModal = require('./DashboardModal')

beforeAll(() => {
  configure({ adapter: new ReactAdapter() })
})

beforeEach(() => {
  Object.assign(require('@uppy/dashboard').prototype, {
    openModal: jest.fn(),
    closeModal: jest.fn(),
  })
})

describe('react <DashboardModal />', () => {
  it('can be mounted and unmounted', () => {
    const oninstall = jest.fn()
    const onuninstall = jest.fn()
    const uppy = new Uppy()
    const dash = mount((
      <DashboardModal
        uppy={uppy}
        onInstall={oninstall}
        onUninstall={onuninstall}
      />
    ))

    expect(oninstall).toHaveBeenCalled()
    expect(onuninstall).not.toHaveBeenCalled()

    dash.unmount()

    expect(oninstall).toHaveBeenCalled()
    expect(onuninstall).toHaveBeenCalled()
  })

  it('opens the modal using the `open={true}` prop', () => {
    const uppy = new Uppy()
    const dash = mount((
      <DashboardModal
        uppy={uppy}
        open={false}
      />
    ))
    const { plugin } = dash.instance()

    expect(plugin.openModal).not.toHaveBeenCalled()

    dash.setProps({ open: true })

    expect(plugin.openModal).toHaveBeenCalled()

    dash.unmount()
  })

  it('closes the modal using the `open={false}` prop', () => {
    const uppy = new Uppy()
    const dash = mount((
      <DashboardModal
        uppy={uppy}
        open
      />
    ))
    const { plugin } = dash.instance()

    expect(plugin.openModal).toHaveBeenCalled()
    expect(plugin.closeModal).not.toHaveBeenCalled()

    dash.setProps({ open: false })

    expect(plugin.closeModal).toHaveBeenCalled()

    dash.unmount()
  })

  it('react on HTMLDivElement props update', async () => {
    const uppy = new Uppy()
    const dash = mount((
      <DashboardModal
        uppy={uppy}
        hidden
      />
    ))

    expect(dash.getDOMNode().hidden).toBeTruthy()

    dash.setProps({ hidden: false })

    expect(dash.getDOMNode().hidden).toBeFalsy()

    dash.unmount()
  })

  it('react on @uppy/dashboard props update', async () => {
    const uppy = new Uppy()
    const dash = mount((
      <DashboardModal
        uppy={uppy}
        theme="dark"
      />
    ))

    const { plugin } = dash.instance()

    expect(plugin.opts.theme).toBe('dark')

    dash.setProps({ theme: 'light' })
    expect(plugin.opts.theme).toBe('light')

    dash.unmount()
  })
})
