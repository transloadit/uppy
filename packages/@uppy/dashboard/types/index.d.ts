import type { PluginOptions, UIPlugin, PluginTarget, UppyFile } from '@uppy/core'
import type { StatusBarLocale } from '@uppy/status-bar'
import DashboardLocale from './generatedLocale'

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

export interface DashboardOptions extends PluginOptions {
  animateOpenClose?: boolean
  browserBackButtonClose?: boolean
  closeAfterFinish?: boolean
  closeModalOnClickOutside?: boolean
  disableInformer?: boolean
  disablePageScrollWhenModalOpen?: boolean
  disableStatusBar?: boolean
  disableThumbnailGenerator?: boolean
  doneButtonHandler?: () => void
  height?: string | number
  hideCancelButton?: boolean
  hidePauseResumeButton?: boolean
  hideProgressAfterFinish?: boolean
  hideRetryButton?: boolean
  hideUploadButton?: boolean
  inline?: boolean
  locale?: DashboardLocale & StatusBarLocale
  metaFields?: MetaField[] | ((file: UppyFile) => MetaField[])
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
  target?: PluginTarget
  theme?: 'auto' | 'dark' | 'light'
  thumbnailWidth?: number
  trigger?: string
  width?: string | number
  autoOpenFileEditor?: boolean
  disabled?: boolean
    disableLocalFiles?: boolean
}

declare class Dashboard extends UIPlugin<DashboardOptions> {
  addTarget (plugin: UIPlugin): HTMLElement
  hideAllPanels (): void
  openModal (): void
  closeModal (): void
  isModalOpen (): boolean
  render (state: object): void
  install (): void
  uninstall (): void
}

export default Dashboard
