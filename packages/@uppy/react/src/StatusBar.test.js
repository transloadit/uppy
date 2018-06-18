const h = require('react').createElement
const { mount, configure } = require('enzyme')
const ReactAdapter = require('enzyme-adapter-react-16')
const Uppy = require('@uppy/core')

beforeAll(() => {
  configure({ adapter: new ReactAdapter() })
})

jest.mock('@uppy/statusbar', () => require('./__mocks__/StatusBarPlugin'))

const StatusBar = require('./StatusBar')

describe('react <StatusBar />', () => {
  it('can be mounted and unmounted', () => {
    const oninstall = jest.fn()
    const onuninstall = jest.fn()
    const uppy = Uppy()
    const dash = mount((
      <StatusBar
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
