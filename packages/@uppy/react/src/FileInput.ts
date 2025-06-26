import type {
  Body,
  Meta,
  UIPluginOptions,
  UnknownPlugin,
  Uppy,
} from '@uppy/core'
import FileInputPlugin, { type FileInputOptions } from '@uppy/file-input'
import { Component, createElement as h } from 'react'

interface FileInputProps<M extends Meta, B extends Body>
  extends UIPluginOptions {
  uppy: Uppy<M, B>
  locale?: FileInputOptions['locale']
  pretty?: boolean
  inputName?: string
}

/**
 * React component that renders an area in which files can be dropped to be
 * uploaded.
 */

class FileInput<M extends Meta, B extends Body> extends Component<
  FileInputProps<M, B>
> {
  // Must be kept in sync with @uppy/file-input/src/FileInput.js
  static defaultProps = {
    locale: undefined,
    pretty: true,
    inputName: 'files[]',
  }

  private container!: HTMLElement

  private plugin?: UnknownPlugin<M, B>

  componentDidMount(): void {
    this.installPlugin()
  }

  componentDidUpdate(prevProps: FileInputProps<M, B>): void {
    if (prevProps.uppy !== this.props.uppy) {
      this.uninstallPlugin(prevProps)
      this.installPlugin()
    }
  }

  componentWillUnmount(): void {
    this.uninstallPlugin()
  }

  installPlugin(): void {
    const { uppy, locale, pretty, inputName, id } = this.props
    const options = {
      id: id || 'FileInput',
      locale,
      pretty,
      inputName,
      target: this.container,
    }

    uppy.use(FileInputPlugin, options)

    this.plugin = uppy.getPlugin(options.id)!
  }

  uninstallPlugin(props = this.props): void {
    const { uppy } = props

    uppy.removePlugin(this.plugin!)
  }

  render() {
    return h('div', {
      className: 'uppy-Container',
      ref: (container: HTMLElement) => {
        this.container = container
      },
    })
  }
}

export default FileInput
