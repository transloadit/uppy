const h = require('react').createElement
const { mount, configure } = require('enzyme')
const ReactAdapter = require('enzyme-adapter-react-16')
const Uppy = require('@uppy/core')

beforeAll(() => {
  configure({ adapter: new ReactAdapter() })
})

jest.mock('@uppy/file-input', () => require('./__mocks__/FileInputPlugin'))

const FileInput = require('./FileInput')

describe('react <FileInput />', () => {
  it('can be mounted and unmounted', () => {
    const oninstall = jest.fn()
    const onuninstall = jest.fn()
    const uppy = new Uppy()
    const input = mount((
      <FileInput
        uppy={uppy}
        onInstall={oninstall}
        onUninstall={onuninstall}
      />
    ))

    expect(oninstall).toHaveBeenCalled()
    expect(onuninstall).not.toHaveBeenCalled()

    input.unmount()

    expect(oninstall).toHaveBeenCalled()
    expect(onuninstall).toHaveBeenCalled()
  })
})
