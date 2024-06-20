import { createElement as h, Component } from 'react'
import type { UIPluginOptions, UnknownPlugin, Uppy } from '@uppy/core'
import FileInputPlugin from '@uppy/file-input'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { Locale } from '@uppy/utils/lib/Translator'

interface FileInputProps<M extends Meta, B extends Body>
  extends UIPluginOptions {
  uppy: Uppy<M, B>
  locale?: Locale
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
  // Must be kept in sync with @uppy/file-input/src/FileInput.jsx
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
    // eslint-disable-next-line react/destructuring-assignment
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

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
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
