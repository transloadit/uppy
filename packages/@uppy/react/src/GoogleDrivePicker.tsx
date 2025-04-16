import { useEffect, useRef, useContext, createElement as h } from 'react'
import {
  GoogleDrivePicker as PreactGoogleDrivePicker,
  type GoogleDrivePickerProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'

export default function GoogleDrivePicker(
  props: Omit<GoogleDrivePickerProps, 'render' | 'ctx'>,
) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactGoogleDrivePicker, {
          ...props,
          ctx,
        } satisfies GoogleDrivePickerProps),
        ref.current,
      )
    }
  }, [ctx, props])

  return h('div', { ref })
}
