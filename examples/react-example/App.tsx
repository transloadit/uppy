/* eslint-disable */
import React from 'react'
import { createRoot } from 'react-dom/client'
import Uppy, {
  UIPlugin,
  type Meta,
  type Body,
  type UIPluginOptions,
  type State,
} from '@uppy/core'
import Tus from '@uppy/tus'
import Webcam from '@uppy/webcam'
import { Dashboard, useUppyState } from '@uppy/react'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
import '@uppy/webcam/dist/style.css'

interface MyPluginOptions extends UIPluginOptions {}

interface MyPluginState extends Record<string, unknown> {}

// Custom plugin example inside React
class MyPlugin<M extends Meta, B extends Body> extends UIPlugin<
  MyPluginOptions,
  M,
  B,
  MyPluginState
> {
  container!: HTMLElement

  constructor(uppy: Uppy<M, B>, opts?: MyPluginOptions) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.id = this.opts.id || 'TEST'
    this.title = 'Test'
  }

  override install() {
    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  override uninstall() {
    this.unmount()
  }

  override render(state: State<M, B>, container: HTMLElement) {
    // Important: during the initial render is not defined. Safely return.
    if (!container) return
    createRoot(container).render(
      <h2>React component inside Uppy's Preact UI</h2>,
    )
  }
}

const metaFields = [
  { id: 'license', name: 'License', placeholder: 'specify license' },
]

function createUppy() {
  return new Uppy({ restrictions: { requiredMetaFields: ['license'] } })
    .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' })
    .use(Webcam)
    .use(MyPlugin)
}

export default function App() {
  // IMPORTANT: passing an initaliser function to useState
  // to prevent creating a new Uppy instance on every render.
  // useMemo is a performance hint, not a guarantee.
  const [uppy] = React.useState(createUppy)
  // You can access state reactively with useUppyState
  const fileCount = useUppyState(
    uppy,
    (state) => Object.keys(state.files).length,
  )
  const totalProgress = useUppyState(uppy, (state) => state.totalProgress)
  // Also possible to get the state of all plugins.
  const plugins = useUppyState(uppy, (state) => state.plugins)

  return (
    <>
      <p>File count: {fileCount}</p>
      <p>Total progress: {totalProgress}</p>
      <Dashboard uppy={uppy} metaFields={metaFields} />
    </>
  )
}
