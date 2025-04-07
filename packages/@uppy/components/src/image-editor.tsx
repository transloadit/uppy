/* eslint-disable react/destructuring-assignment */
import { h } from 'preact'
import { useContext, useRef, useEffect } from 'preact/hooks'
import UppyImageEditor, { type ImageEditorOptions } from '@uppy/image-editor'
import type { UppyFile, Meta, Body } from '@uppy/core'
import { UppyContext } from './index.js'

type ImageEditorProps = {
  file: UppyFile<Meta, Body>
  onSave?: () => void
  children?: any
} & ImageEditorOptions

function ImageEditor(props: ImageEditorProps) {
  const ref = useRef<HTMLDivElement>(null)

  const ctx = useContext(UppyContext)

  useEffect(() => {
    if (!ctx.uppy?.getPlugin('ImageEditor')) {
      ctx.uppy?.use(UppyImageEditor, {
        ...props,
        target: ref.current ?? undefined,
      })
    }
  }, [ctx.uppy, props])

  useEffect(() => {
    const { file, ...rest } = props
    if (file) {
      ctx.uppy
        ?.getPlugin<UppyImageEditor<any, any>>('ImageEditor')
        ?.selectFile(file)
    }
    ctx.uppy?.getPlugin('ImageEditor')?.setOptions(rest)
  }, [ctx.uppy, props])

  useEffect(() => {
    return () => {
      const plugin = ctx.uppy?.getPlugin('ImageEditor')
      if (plugin) {
        ctx.uppy?.removePlugin(plugin)
      }
    }
  }, [ctx.uppy])

  return (
    <div>
      <div className="" ref={ref} />
      {props.children}
    </div>
  )
}

export default ImageEditor
