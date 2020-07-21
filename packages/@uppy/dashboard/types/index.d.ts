import Uppy = require('@uppy/core')
import StatusBar = require('@uppy/status-bar')
import DashboardLocale = require('./generatedLocale')

type FieldRenderOptions = {
  value: string,
  onChange: (newVal: string) => void
}

type PreactRender = (node: any, params: object | null, ...children: any[]) => any

interface MetaField {
  id: string
  name: string
  placeholder?: string
  render?: (field: FieldRenderOptions, h: PreactRender) => any
}

declare module Dashboard {
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
    fileManagerSelectionType?: 'files' | 'folders' | 'both';
    proudlyDisplayPoweredByUppy?: boolean
    showLinkToFileUploadResult?: boolean
    showProgressDetails?: boolean
    showSelectedFiles?: boolean
    showRemoveButtonAfterComplete?: boolean
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    theme?: 'auto' | 'dark' | 'light'
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
