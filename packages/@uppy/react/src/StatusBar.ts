import { createElement as h, Component } from 'react'
import PropTypes from 'prop-types'
import type { UnknownPlugin, Uppy } from '@uppy/core'
import StatusBarPlugin, { type StatusBarOptions } from '@uppy/status-bar'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import { uppy as uppyPropType } from './propTypes.ts'
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
  static propTypes = {
    uppy: uppyPropType.isRequired,
    hideUploadButton: PropTypes.bool,
    hideRetryButton: PropTypes.bool,
    hidePauseResumeButton: PropTypes.bool,
    hideCancelButton: PropTypes.bool,
    showProgressDetails: PropTypes.bool,
    hideAfterFinish: PropTypes.bool,
    doneButtonHandler: PropTypes.func,
  }

  // Must be kept in sync with @uppy/status-bar/src/StatusBar.jsx.
  static defaultProps = {
    hideUploadButton: false,
    hideRetryButton: false,
    hidePauseResumeButton: false,
    hideCancelButton: false,
    showProgressDetails: false,
    hideAfterFinish: true,
    doneButtonHandler: null,
  }

  private container: HTMLElement

  private plugin: UnknownPlugin<M, B>

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
    } = this.props
    const options = {
      id: 'react:StatusBar',
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

export default StatusBar
