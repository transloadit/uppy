const h = require('react').createElement
const { mount, configure } = require('enzyme')
const ReactAdapter = require('enzyme-adapter-react-16')
const Uppy = require('../core')

jest.mock('../plugins/Dashboard', () => require('./__mocks__/DashboardPlugin'))

const DashboardModal = require('./DashboardModal')

beforeAll(() => {
  configure({ adapter: new ReactAdapter() })
})

beforeEach(() => {
  Object.assign(require('../plugins/Dashboard').prototype, {
    openModal: jest.fn(),
    closeModal: jest.fn()
  })
})

describe('react <DashboardModal />', () => {
  it('can be mounted and unmounted', () => {
    const oninstall = jest.fn()
    const onuninstall = jest.fn()
    const uppy = Uppy()
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
    const uppy = Uppy()
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
    const uppy = Uppy()
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
})
