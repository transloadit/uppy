import Uppy = require('@uppy/core')
import StatusBar = require('@uppy/status-bar')

interface MetaField {
  id: string
  name: string
  placeholder?: string
}

declare module Dashboard {
  type DashboardLocale = Uppy.Locale<
    | 'closeModal'
    | 'importFrom'
    | 'addingMoreFiles'
    | 'addMoreFiles'
    | 'dashboardWindowTitle'
    | 'dashboardTitle'
    | 'copyLinkToClipboardSuccess'
    | 'copyLinkToClipboardFallback'
    | 'copyLink'
    | 'link'
    | 'fileSource'
    | 'done'
    | 'back'
    | 'addMore'
    | 'removeFile'
    | 'editFile'
    | 'editing'
    | 'edit'
    | 'finishEditingFile'
    | 'saveChanges'
    | 'cancel'
    | 'myDevice'
    | 'dropPasteImport'
    | 'dropPaste'
    | 'dropHint'
    | 'browse'
    | 'uploadComplete'
    | 'uploadPaused'
    | 'resumeUpload'
    | 'pauseUpload'
    | 'retryUpload'
    | 'cancelUpload'
    | 'xFilesSelected'
    | 'uploadingXFiles'
    | 'processingXFiles'
    | 'poweredBy'
  >

  interface DashboardOptions extends Uppy.PluginOptions {
    animateOpenClose?: boolean
    browserBackButtonClose?: boolean
    closeAfterFinish?: boolean
    closeModalOnClickOutside?: boolean
    disableInformer?: boolean
    disablePageScrollWhenModalOpen?: boolean
    disableStatusBar?: boolean
    disableThumbnailGenerator?: boolean
    height?: string | number
    hideCancelButton?: boolean
    hidePauseResumeButton?: boolean
    hideProgressAfterFinish?: boolean
    hideRetryButton?: boolean
    hideUploadButton?: boolean
    inline?: boolean
    locale?: DashboardLocale & StatusBar.StatusBarLocale
    metaFields?: MetaField[]
    note?: string | null
    onRequestCloseModal?: () => void
    plugins?: string[]
    proudlyDisplayPoweredByUppy?: boolean
    showLinkToFileUploadResult?: boolean
    showProgressDetails?: boolean
    showSelectedFiles?: boolean
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    thumbnailWidth?: number
    trigger?: string
    width?: string | number
  }
}

declare class Dashboard extends Uppy.Plugin<Dashboard.DashboardOptions> {
  addTarget (plugin: Uppy.Plugin): HTMLElement
  hideAllPanels (): void
  openModal (): void
  closeModal (): void
  isModalOpen (): boolean
  render (state: object): void
  install (): void
  uninstall (): void
}

export = Dashboard
