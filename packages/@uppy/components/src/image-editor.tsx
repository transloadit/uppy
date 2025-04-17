/* eslint-disable react/destructuring-assignment */
import { h } from 'preact'
import { useRef, useEffect } from 'preact/hooks'
import UppyImageEditor, { type ImageEditorOptions } from '@uppy/image-editor'
import type { UppyFile, Meta, Body } from '@uppy/core'
import type { Component, InjectedProps } from './types.js'
import { InjectedOrChildren } from './internal/injected.js'

export type ImageEditorProps = {
  file: UppyFile<Meta, Body>
  onSave?: () => void
  child?: () => Component
} & ImageEditorOptions &
  InjectedProps

export default function ImageEditor(props: ImageEditorProps) {
  const imageEditorRef = useRef<HTMLDivElement>(null)
  const { ctx, child, render } = props

  useEffect(() => {
    if (!ctx.uppy?.getPlugin('ImageEditor')) {
      ctx.uppy?.use(UppyImageEditor, {
        ...props,
        target: imageEditorRef.current ?? undefined,
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
      <div className="" ref={imageEditorRef} />
      <InjectedOrChildren
        render={render}
        item={() => child?.()}
        id="image-editor"
      />
    </div>
  )
}
