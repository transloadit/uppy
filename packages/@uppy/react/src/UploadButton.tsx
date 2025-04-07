import { useEffect, useRef, createElement as h, useContext } from 'react'
import { render } from 'preact'
import { UploadButton as PreactUploadButton } from '@uppy/components'
import { UppyContext } from './UppyContextProvider.js'

export default function UploadButton() {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)

  useEffect(() => {
    if (ref.current) {
      render(PreactUploadButton({ ctx }), ref.current)
    }
  }, [ctx])

  return <div ref={ref} />
}
