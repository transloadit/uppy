import { createElement as h, Component } from 'react'
import PropTypes from 'prop-types'
import type { UnknownPlugin, Uppy } from '@uppy/core'
import DragDropPlugin, { type DragDropOptions } from '@uppy/drag-drop'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import * as propTypes from './propTypes.ts'
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
  static propTypes = {
    uppy: propTypes.uppy.isRequired,
    locale: propTypes.locale,
    inputName: PropTypes.string,
    width: PropTypes.string,
    height: PropTypes.string,
    note: PropTypes.string,
  }

  // Must be kept in sync with @uppy/drag-drop/src/DragDrop.jsx.
  static defaultProps = {
    locale: null,
    inputName: 'files[]',
    width: '100%',
    height: '100%',
    note: null,
  }

  private container: HTMLElement

  private plugin: UnknownPlugin<M, B>

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
    const { uppy, locale, inputName, width, height, note } = this.props
    const options = {
      id: 'react:DragDrop',
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

  render(): JSX.Element {
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
