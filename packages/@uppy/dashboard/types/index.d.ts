import type {
  IndexedObject,
  PluginTarget,
  UIPlugin,
  UIPluginOptions,
  UppyFile,
} from '@uppy/core'
import type { StatusBarLocale } from '@uppy/status-bar'
import type { ThumbnailOptions } from '@uppy/thumbnail-generator'
import DashboardLocale from './generatedLocale'

type FieldRenderOptions = {
  value: string
  onChange: (newVal: string) => void
  fieldCSSClasses: { text: string }
  required: boolean
  form: string
}

type PreactRender = (
  node: any,
  params: Record<string, unknown> | null,
  ...children: any[]
) => any

interface MetaField {
  id: string
  name: string
  placeholder?: string
  render?: (field: FieldRenderOptions, h: PreactRender) => any
}

type Options = UIPluginOptions & ThumbnailOptions

export interface DashboardOptions extends Options {
  animateOpenClose?: boolean
  browserBackButtonClose?: boolean
  closeAfterFinish?: boolean
  singleFileFullScreen?: boolean
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
  fileManagerSelectionType?: 'files' | 'folders' | 'both'
  proudlyDisplayPoweredByUppy?: boolean
  showLinkToFileUploadResult?: boolean
  showProgressDetails?: boolean
  showSelectedFiles?: boolean
  showRemoveButtonAfterComplete?: boolean
  showNativePhotoCameraButton?: boolean
  showNativeVideoCameraButton?: boolean
  target?: PluginTarget
  theme?: 'auto' | 'dark' | 'light'
  trigger?: string
  width?: string | number
  autoOpen?: 'metaEditor' | 'imageEditor' | null
  /** @deprecated use option autoOpen instead */
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
  addTarget(plugin: UIPlugin): HTMLElement

  hideAllPanels(): void

  openModal(): void

  closeModal(): void

  isModalOpen(): boolean

  render(state: Record<string, unknown>): void

  install(): void

  uninstall(): void
}

export default Dashboard

// Events

export type DashboardFileEditStartCallback<TMeta extends IndexedObject<any>> = (
  file?: UppyFile<TMeta>,
) => void
export type DashboardFileEditCompleteCallback<
  TMeta extends IndexedObject<any>,
> = (file?: UppyFile<TMeta>) => void
export type DashboardShowPlanelCallback = (id: string) => void
declare module '@uppy/core' {
  export interface UppyEventMap<TMeta> {
    'dashboard:modal-open': GenericEventCallback
    'dashboard:modal-closed': GenericEventCallback
    'dashboard:show-panel': DashboardShowPlanelCallback
    'dashboard:file-edit-start': DashboardFileEditStartCallback<TMeta>
    'dashboard:file-edit-complete': DashboardFileEditCompleteCallback<TMeta>
  }
}
