import { useEffect, useRef, useContext, createElement as h } from 'react'
import {
  GoogleDrivePicker as PreactGoogleDrivePicker,
  type GoogleDrivePickerProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'
import useReactRender from './useReactRender.js'

export default function GoogleDrivePicker(
  props: Omit<GoogleDrivePickerProps, 'ctx' | 'render'>,
) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactGoogleDrivePicker, {
          ...props,
          ctx,
          render: reactRender,
        } satisfies GoogleDrivePickerProps),
        ref.current,
      )
    }
  }, [ctx, props, reactRender])

  return <div ref={ref} />
}
