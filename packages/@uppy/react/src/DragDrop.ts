import type { Body, Meta, UnknownPlugin, Uppy } from '@uppy/core'
import DragDropPlugin, { type DragDropOptions } from '@uppy/drag-drop'
import { Component, createElement as h } from 'react'
import getHTMLProps from './getHTMLProps.js'
import nonHtmlPropsHaveChanged from './nonHtmlPropsHaveChanged.js'

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
    if (prevProps.uppy !== this.props.uppy) {
      this.uninstallPlugin(prevProps)
      this.installPlugin()
    } else if (nonHtmlPropsHaveChanged(this.props, prevProps)) {
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
