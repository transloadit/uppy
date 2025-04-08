import { useEffect, useRef, createElement as h, useContext } from 'react'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UploadButton as PreactUploadButton } from '@uppy/components'
import { UppyContext } from './UppyContextProvider.js'

export default function UploadButton() {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)

  useEffect(() => {
    if (ref.current) {
      preactRender(preactH(PreactUploadButton, { ctx }), ref.current)
    }
  }, [ctx])

  return <div ref={ref} />
}
