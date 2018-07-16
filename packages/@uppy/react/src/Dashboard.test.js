const h = require('react').createElement
const { mount, configure } = require('enzyme')
const ReactAdapter = require('enzyme-adapter-react-16')
const Uppy = require('@uppy/core')

beforeAll(() => {
  configure({ adapter: new ReactAdapter() })
})

jest.mock('@uppy/dashboard', () => require('./__mocks__/DashboardPlugin'))

const Dashboard = require('./Dashboard')

describe('react <Dashboard />', () => {
  it('can be mounted and unmounted', () => {
    const oninstall = jest.fn()
    const onuninstall = jest.fn()
    const uppy = Uppy()
    const dash = mount((
      <Dashboard
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
})
