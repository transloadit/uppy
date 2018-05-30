const h = require('react').createElement
const { mount, configure } = require('enzyme')
const ReactAdapter = require('enzyme-adapter-react-16')
const Uppy = require('../core')

beforeAll(() => {
  configure({ adapter: new ReactAdapter() })
})

jest.mock('../plugins/DragDrop', () => require('./__mocks__/DragDropPlugin'))

const DragDrop = require('./DragDrop')

describe('react <DragDrop />', () => {
  it('can be mounted and unmounted', () => {
    const oninstall = jest.fn()
    const onuninstall = jest.fn()
    const uppy = Uppy()
    const dash = mount((
      <DragDrop
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
