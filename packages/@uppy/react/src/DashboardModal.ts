import { createElement as h, Component } from 'react'
import PropTypes from 'prop-types'
import DashboardPlugin, { type DashboardOptions } from '@uppy/dashboard'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { Uppy } from '@uppy/core'
import {
  cssSize,
  locale,
  metaFields,
  plugins,
  uppy as uppyPropType,
} from './propTypes.ts'
import getHTMLProps from './getHTMLProps.ts'
import nonHtmlPropsHaveChanged from './nonHtmlPropsHaveChanged.ts'

type DashboardInlineOptions<M extends Meta, B extends Body> = Omit<
  DashboardOptions<M, B> & { inline: false },
  'inline' | 'onRequestCloseModal'
> &
  React.BaseHTMLAttributes<HTMLDivElement>

export interface DashboardModalProps<M extends Meta, B extends Body>
  extends DashboardInlineOptions<M, B> {
  uppy: Uppy<M, B>
  onRequestClose: () => void
  open: boolean
}

/**
 * React Component that renders a Dashboard for an Uppy instance in a Modal
 * dialog. Visibility of the Modal is toggled using the `open` prop.
 */

class DashboardModal<M extends Meta, B extends Body> extends Component<
  DashboardModalProps<M, B>
> {
  static propTypes = {
    uppy: uppyPropType.isRequired,
    target:
      typeof window !== 'undefined' ?
        PropTypes.instanceOf(window.HTMLElement)
      : PropTypes.any,
    open: PropTypes.bool,
    onRequestClose: PropTypes.func,
    closeModalOnClickOutside: PropTypes.bool,
    disablePageScrollWhenModalOpen: PropTypes.bool,
    plugins,
    width: cssSize,
    height: cssSize,
    showProgressDetails: PropTypes.bool,
    note: PropTypes.string,
    metaFields,
    proudlyDisplayPoweredByUppy: PropTypes.bool,
    autoOpenFileEditor: PropTypes.bool,
    animateOpenClose: PropTypes.bool,
    browserBackButtonClose: PropTypes.bool,
    closeAfterFinish: PropTypes.bool,
    disableStatusBar: PropTypes.bool,
    disableInformer: PropTypes.bool,
    disableThumbnailGenerator: PropTypes.bool,
    disableLocalFiles: PropTypes.bool,
    disabled: PropTypes.bool,
    hideCancelButton: PropTypes.bool,
    hidePauseResumeButton: PropTypes.bool,
    hideProgressAfterFinish: PropTypes.bool,
    hideRetryButton: PropTypes.bool,
    hideUploadButton: PropTypes.bool,
    showLinkToFileUploadResult: PropTypes.bool,
    showRemoveButtonAfterComplete: PropTypes.bool,
    showSelectedFiles: PropTypes.bool,
    waitForThumbnailsBeforeUpload: PropTypes.bool,
    fileManagerSelectionType: PropTypes.string,
    theme: PropTypes.string,
    // pass-through to ThumbnailGenerator
    thumbnailType: PropTypes.string,
    thumbnailWidth: PropTypes.number,
    locale,
  }

  // Must be kept in sync with @uppy/dashboard/src/Dashboard.jsx.
  static defaultProps = {
    metaFields: [],
    plugins: [],
    width: 750,
    height: 550,
    thumbnailWidth: 280,
    thumbnailType: 'image/jpeg',
    waitForThumbnailsBeforeUpload: false,
    showLinkToFileUploadResult: false,
    showProgressDetails: false,
    hideUploadButton: false,
    hideCancelButton: false,
    hideRetryButton: false,
    hidePauseResumeButton: false,
    hideProgressAfterFinish: false,
    note: null,
    closeModalOnClickOutside: false,
    closeAfterFinish: false,
    disableStatusBar: false,
    disableInformer: false,
    disableThumbnailGenerator: false,
    disablePageScrollWhenModalOpen: true,
    animateOpenClose: true,
    fileManagerSelectionType: 'files',
    proudlyDisplayPoweredByUppy: true,
    showSelectedFiles: true,
    showRemoveButtonAfterComplete: false,
    browserBackButtonClose: false,
    theme: 'light',
    autoOpenFileEditor: false,
    disabled: false,
    disableLocalFiles: false,

    // extra
    open: undefined,
    target: undefined,
    locale: null,
    onRequestClose: undefined,
  }

  private container: HTMLElement

  private plugin: DashboardPlugin<M, B>

  componentDidMount(): void {
    this.installPlugin()
  }

  componentDidUpdate(prevProps: DashboardModal<M, B>['props']): void {
    const { uppy, open, onRequestClose } = this.props
    if (prevProps.uppy !== uppy) {
      this.uninstallPlugin(prevProps)
      this.installPlugin()
    } else if (nonHtmlPropsHaveChanged(this.props, prevProps)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-shadow
      const { uppy, ...options } = {
        ...this.props,
        inline: false,
        onRequestCloseModal: onRequestClose,
      }
      this.plugin.setOptions(options)
    }
    if (prevProps.open && !open) {
      this.plugin.closeModal()
    } else if (!prevProps.open && open) {
      this.plugin.openModal()
    }
  }

  componentWillUnmount(): void {
    this.uninstallPlugin()
  }

  installPlugin(): void {
    const {
      target = this.container,
      open,
      onRequestClose,
      uppy,
      ...rest
    } = this.props
    const options = {
      ...rest,
      id: 'react:DashboardModal',
      inline: false,
      target,
      open,
      onRequestCloseModal: onRequestClose,
    }

    uppy.use(DashboardPlugin<M, B>, options)

    this.plugin = uppy.getPlugin(options.id) as DashboardPlugin<M, B>
    if (open) {
      this.plugin.openModal()
    }
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

export default DashboardModal
