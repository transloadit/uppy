import { h } from 'preact'
import { useContext, useRef, useEffect } from 'preact/hooks'
import UppyGoogleDrivePicker from '@uppy/google-drive-picker'
import { UppyContext } from './index.js'

type GoogleDrivePickerProps = {
  // TODO: GoogleDrivePickerOptions is not exported from the plugin
  [key: string]: any
}

function GoogleDrivePicker(props: GoogleDrivePickerProps) {
  const ref = useRef<HTMLDivElement>(null)

  const ctx = useContext(UppyContext)

  useEffect(() => {
    if (!ctx.uppy?.getPlugin('GoogleDrivePicker')) {
      // @ts-expect-error todo
      ctx.uppy?.use(UppyGoogleDrivePicker, {
        ...props,
      })
    }
  }, [ctx.uppy, props])

  useEffect(() => {
    ctx.uppy?.getPlugin('GoogleDrivePicker')?.setOptions(props)
  }, [ctx.uppy, props])

  useEffect(() => {
    return () => {
      const plugin = ctx.uppy?.getPlugin('GoogleDrivePicker')
      if (plugin) {
        ctx.uppy?.removePlugin(plugin)
      }
    }
  }, [ctx.uppy])

  return <div className="" ref={ref} />
}

export default GoogleDrivePicker
