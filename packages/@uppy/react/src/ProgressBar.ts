import { createElement as h, Component } from 'react'
import type { UnknownPlugin, Uppy } from '@uppy/core'
import ProgressBarPlugin, { type ProgressBarOptions } from '@uppy/progress-bar'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import getHTMLProps from './getHTMLProps.ts'
import nonHtmlPropsHaveChanged from './nonHtmlPropsHaveChanged.ts'

interface ProgressBarProps<M extends Meta, B extends Body>
  extends ProgressBarOptions {
  uppy: Uppy<M, B>
}

/**
 * React component that renders a progress bar at the top of the page.
 */

class ProgressBar<M extends Meta, B extends Body> extends Component<
  ProgressBarProps<M, B>
> {
  private container!: HTMLElement

  private plugin!: UnknownPlugin<M, B>

  componentDidMount(): void {
    this.installPlugin()
  }

  componentDidUpdate(prevProps: ProgressBar<M, B>['props']): void {
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
    const { uppy, fixed, hideAfterFinish, id } = this.props
    const options = {
      id: id || 'ProgressBar',
      fixed,
      hideAfterFinish,
      target: this.container,
    }

    uppy.use(ProgressBarPlugin, options)

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

export default ProgressBar
