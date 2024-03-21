import { createElement as h, Component } from 'react'
import PropTypes from 'prop-types'
import DashboardPlugin from '@uppy/dashboard'
import type { PluginTarget } from '@uppy/core/lib/UIPlugin'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import {
  cssSize,
  locale,
  metaFields,
  plugins,
  uppy as uppyPropType,
} from './propTypes.ts'
import getHTMLProps from './getHTMLProps.ts'
import nonHtmlPropsHaveChanged from './nonHtmlPropsHaveChanged.ts'
import type { DashboardProps } from './Dashboard.ts'

interface DashboardModalProps<M extends Meta, B extends Body>
  extends DashboardProps<M, B> {
  animateOpenClose?: boolean
  disableLocalFiles?: boolean
  autoOpenFileEditor?: boolean
  browserBackButtonClose?: boolean
  showRemoveButtonAfterComplete?: boolean
  showSelectedFiles?: boolean
  theme?: string
  waitForThumbnailsBeforeUpload?: boolean
  fileManagerSelectionType?: string
  hideRetryButton?: boolean
  showLinkToFileUploadResult?: boolean
  closeAfterFinish?: boolean
  disabled?: boolean
  target?: PluginTarget<M, B>
  open?: boolean
  onRequestClose: () => void
  closeModalOnClickOutside?: boolean
  disablePageScrollWhenModalOpen?: boolean
  hideCancelButton?: boolean
  hidePauseResumeButton?: boolean
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
    inline: PropTypes.bool,
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
    inline: false,
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

  componentDidMount(): void {
    this.installPlugin()
  }

  componentDidUpdate(prevProps: DashboardModalProps<M, B>): void {
    const { uppy, open, onRequestClose } = this.props
    if (prevProps.uppy !== uppy) {
      this.uninstallPlugin(prevProps)
      this.installPlugin()
    } else if (nonHtmlPropsHaveChanged(this.props, prevProps)) {
      const options = { ...this.props, onRequestCloseModal: onRequestClose }
      delete options.uppy
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
      id = 'react:DashboardModal',
      uppy,
      target,
      open,
      onRequestClose,
      closeModalOnClickOutside,
      disablePageScrollWhenModalOpen,
      inline,
      plugins, // eslint-disable-line no-shadow
      width,
      height,
      showProgressDetails,
      note,
      metaFields, // eslint-disable-line no-shadow
      proudlyDisplayPoweredByUppy,
      autoOpenFileEditor,
      animateOpenClose,
      browserBackButtonClose,
      closeAfterFinish,
      disableStatusBar,
      disableInformer,
      disableThumbnailGenerator,
      disableLocalFiles,
      disabled,
      hideCancelButton,
      hidePauseResumeButton,
      hideProgressAfterFinish,
      hideRetryButton,
      hideUploadButton,
      showLinkToFileUploadResult,
      showRemoveButtonAfterComplete,
      showSelectedFiles,
      waitForThumbnailsBeforeUpload,
      fileManagerSelectionType,
      theme,
      thumbnailType,
      thumbnailWidth,
      locale, // eslint-disable-line no-shadow
    } = this.props
    const options = {
      id,
      target,
      closeModalOnClickOutside,
      disablePageScrollWhenModalOpen,
      inline,
      plugins,
      width,
      height,
      showProgressDetails,
      note,
      metaFields,
      proudlyDisplayPoweredByUppy,
      autoOpenFileEditor,
      animateOpenClose,
      browserBackButtonClose,
      closeAfterFinish,
      disableStatusBar,
      disableInformer,
      disableThumbnailGenerator,
      disableLocalFiles,
      disabled,
      hideCancelButton,
      hidePauseResumeButton,
      hideProgressAfterFinish,
      hideRetryButton,
      hideUploadButton,
      showLinkToFileUploadResult,
      showRemoveButtonAfterComplete,
      showSelectedFiles,
      waitForThumbnailsBeforeUpload,
      fileManagerSelectionType,
      theme,
      thumbnailType,
      thumbnailWidth,
      locale,
      onRequestCloseModal: onRequestClose,
    }

    if (!options.target) {
      options.target = this.container
    }

    delete options.uppy
    uppy.use(DashboardPlugin, options)

    this.plugin = uppy.getPlugin(options.id)
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
      ref: (container) => {
        this.container = container
      },
      ...getHTMLProps(this.props),
    })
  }
}

export default DashboardModal
