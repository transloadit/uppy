const { useEffect, useRef } = require('react')
const UppyCore = require('@uppy/core').Uppy

module.exports = function useUppy (factory) {
  if (typeof factory !== 'function') {
    throw new TypeError('useUppy: expected a function that returns a new Uppy instance')
  }

  const uppy = useRef(undefined)
  if (uppy.current === undefined) {
    uppy.current = factory()

    if (!(uppy.current instanceof UppyCore)) {
      throw new TypeError(`useUppy: factory function must return an Uppy instance, got ${typeof uppy.current}`)
    }
  }

  useEffect(() => {
    return () => {
      uppy.current.close()
    }
  }, [])

  return uppy.current
}
