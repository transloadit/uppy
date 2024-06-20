import { createElement as h, Component } from 'react'
import type { UnknownPlugin, Uppy } from '@uppy/core'
import DragDropPlugin, { type DragDropOptions } from '@uppy/drag-drop'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import getHTMLProps from './getHTMLProps.ts'
import nonHtmlPropsHaveChanged from './nonHtmlPropsHaveChanged.ts'

interface DragDropProps<M extends Meta, B extends Body>
  extends DragDropOptions {
  uppy: Uppy<M, B>
}

/**
 * React component that renders an area in which files can be dropped to be
 * uploaded.
 */

class DragDrop<M extends Meta, B extends Body> extends Component<
  DragDropProps<M, B>
> {
  private container!: HTMLElement

  private plugin!: UnknownPlugin<M, B>

  componentDidMount(): void {
    this.installPlugin()
  }

  componentDidUpdate(prevProps: DragDrop<M, B>['props']): void {
    // eslint-disable-next-line react/destructuring-assignment
    if (prevProps.uppy !== this.props.uppy) {
      this.uninstallPlugin(prevProps)
      this.installPlugin()
    } else if (nonHtmlPropsHaveChanged(this.props, prevProps)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { uppy, ...options } = { ...this.props, target: this.container }
      this.plugin.setOptions(options)
    }
  }

  componentWillUnmount(): void {
    this.uninstallPlugin()
  }

  installPlugin(): void {
    const { uppy, locale, inputName, width, height, note, id } = this.props
    const options = {
      id: id || 'DragDrop',
      locale,
      inputName,
      width,
      height,
      note,
      target: this.container,
    }

    uppy.use(DragDropPlugin, options)

    this.plugin = uppy.getPlugin(options.id)!
  }

  uninstallPlugin(props = this.props): void {
    const { uppy } = props

    uppy.removePlugin(this.plugin)
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  render() {
    return h('div', {
      className: 'uppy-Container',
      ref: (container: HTMLElement) => {
        this.container = container
      },
      ...getHTMLProps(this.props),
    })
  }
}

export default DragDrop
