import type { Body, Meta, UnknownPlugin, Uppy } from '@uppy/core'
import StatusBarPlugin, { type StatusBarOptions } from '@uppy/status-bar'
import { Component, createElement as h } from 'react'
import getHTMLProps from './getHTMLProps.js'
import nonHtmlPropsHaveChanged from './nonHtmlPropsHaveChanged.js'

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
