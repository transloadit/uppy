import type { PluginOptions, UIPlugin, PluginTarget, UppyFile, GenericEventCallback } from '@uppy/core'
import type { StatusBarLocale } from '@uppy/status-bar'
import type { ThumbnailOptions } from '@uppy/thumbnail-generator'
import DashboardLocale from './generatedLocale'

type FieldRenderOptions = {
  value: string,
  onChange: (newVal: string) => void
  fieldCSSClasses: { text: string }
  required: boolean
  form: string
}

type PreactRender = (node: any, params: Record<string, unknown> | null, ...children: any[]) => any

interface MetaField {
  id: string
  name: string
  placeholder?: string
  render?: (field: FieldRenderOptions, h: PreactRender) => any
}

type Options = PluginOptions & ThumbnailOptions

export interface DashboardOptions extends Options {
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
  locale?: DashboardLocale & StatusBarLocale
  metaFields?: MetaField[] | ((file: UppyFile) => MetaField[])
  note?: string | null
  plugins?: string[]
  fileManagerSelectionType?: 'files' | 'folders' | 'both';
  proudlyDisplayPoweredByUppy?: boolean
  showLinkToFileUploadResult?: boolean
  showProgressDetails?: boolean
  showSelectedFiles?: boolean
  showRemoveButtonAfterComplete?: boolean
  target?: PluginTarget
  theme?: 'auto' | 'dark' | 'light'
  trigger?: string
  width?: string | number
  autoOpenFileEditor?: boolean
  disabled?: boolean
  disableLocalFiles?: boolean
  onRequestCloseModal?: () => void
  doneButtonHandler?: () => void
  onDragOver?: (event: DragEvent) => void
  onDragLeave?: (event: DragEvent) => void
  onDrop?: (event: DragEvent) => void
}

declare class Dashboard extends UIPlugin<DashboardOptions> {
  addTarget (plugin: UIPlugin): HTMLElement

  hideAllPanels (): void

  openModal (): void

  closeModal (): void

  isModalOpen (): boolean

  render (state: Record<string, unknown>): void

  install (): void

  uninstall (): void
}

export default Dashboard

// Events

export type DashboardFileEditStartCallback<TMeta> = (file: UppyFile<TMeta>) => void;
export type DashboardFileEditCompleteCallback<TMeta> = (file: UppyFile<TMeta>) => void;
declare module '@uppy/core' {
  export interface UppyEventMap<TMeta> {
    'dashboard:modal-open': GenericEventCallback
    'dashboard:modal-closed': GenericEventCallback
    'dashboard:file-edit-state': DashboardFileEditStartCallback<TMeta>
    'dashboard:file-edit-complete': DashboardFileEditCompleteCallback<TMeta>
  }
}
