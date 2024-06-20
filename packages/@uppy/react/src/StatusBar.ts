import { createElement as h, Component } from 'react'
import type { UnknownPlugin, Uppy } from '@uppy/core'
import StatusBarPlugin, { type StatusBarOptions } from '@uppy/status-bar'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import getHTMLProps from './getHTMLProps.ts'
import nonHtmlPropsHaveChanged from './nonHtmlPropsHaveChanged.ts'

interface StatusBarProps<M extends Meta, B extends Body>
  extends StatusBarOptions {
  uppy: Uppy<M, B>
}

/**
 * React component that renders a status bar containing upload progress and speed,
 * processing progress and pause/resume/cancel controls.
 */

class StatusBar<M extends Meta, B extends Body> extends Component<
  StatusBarProps<M, B>
> {
  private container!: HTMLElement

  private plugin!: UnknownPlugin<M, B>

  componentDidMount(): void {
    this.installPlugin()
  }

  componentDidUpdate(prevProps: StatusBar<M, B>['props']): void {
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
    const {
      uppy,
      hideUploadButton,
      hideRetryButton,
      hidePauseResumeButton,
      hideCancelButton,
      showProgressDetails,
      hideAfterFinish,
      doneButtonHandler,
      id,
    } = this.props
    const options = {
      id: id || 'StatusBar',
      hideUploadButton,
      hideRetryButton,
      hidePauseResumeButton,
      hideCancelButton,
      showProgressDetails,
      hideAfterFinish,
      doneButtonHandler,
      target: this.container,
    }

    uppy.use(StatusBarPlugin, options)

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

export default StatusBar
