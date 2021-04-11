const h = require('react').createElement
const { mount, configure } = require('enzyme')
const ReactAdapter = require('enzyme-adapter-react-16')
const Uppy = require('@uppy/core')

beforeAll(() => {
  configure({ adapter: new ReactAdapter() })
})

const useUppy = require('./useUppy')

describe('useUppy()', () => {
  it('is created and deleted according to component lifecycle', () => {
    const oninstall = jest.fn()
    const onuninstall = jest.fn()

    function JustInstance () {
      const uppy = useUppy(() => {
        oninstall()
        return new Uppy()
          .on('cancel-all', onuninstall)
      })

      return <div x={uppy} />
    }

    const el = mount(<JustInstance />)

    expect(oninstall).toHaveBeenCalled()
    expect(onuninstall).not.toHaveBeenCalled()

    el.unmount()

    expect(oninstall).toHaveBeenCalled()
    expect(onuninstall).toHaveBeenCalled()
  })

  it('checks types', () => {
    function NullUppy () {
      const uppy = useUppy(() => null)

      return <div x={uppy} />
    }

    expect(() => {
      mount(<NullUppy />)
    }).toThrow('factory function must return an Uppy instance')

    function GarbageUppy () {
      const uppy = useUppy(() => ({
        garbage: 'lala',
      }))

      return <div x={uppy} />
    }

    expect(() => {
      mount(<GarbageUppy />)
    }).toThrow('factory function must return an Uppy instance')
  })
})
