import type {
  Body,
  Meta,
  State,
  UIPlugin,
  UIPluginOptions,
  Uppy,
  UppyFile,
} from '@uppy/core'
import isDragDropSupported from '@uppy/utils/lib/isDragDropSupported'
import type Translator from '@uppy/utils/lib/Translator'
import type { I18n } from '@uppy/utils/lib/Translator'
import classNames from 'classnames'
import { h } from 'preact'
import type { TargetedEvent } from 'preact/compat'
import type { DashboardState, TargetWithRender } from '../Dashboard.js'
import AddFiles from './AddFiles.js'
import AddFilesPanel from './AddFilesPanel.js'
import EditorPanel from './EditorPanel.js'
import FileCard from './FileCard/index.js'
import FileList from './FileList.js'
import PickerPanelContent from './PickerPanelContent.js'
import PanelTopBar from './PickerPanelTopBar.js'
import Slide from './Slide.js'

// http://dev.edenspiekermann.com/2016/02/11/introducing-accessible-modal-dialog
// https://github.com/ghosh/micromodal

const WIDTH_XL = 900
const WIDTH_LG = 700
const WIDTH_MD = 576

const HEIGHT_MD = 330
// We might want to enable this in the future
// const HEIGHT_LG = 400
// const HEIGHT_XL = 460

type DashboardUIProps<M extends Meta, B extends Body> = {
  state: State<M, B>
  isHidden: boolean
  files: State<M, B>['files']
  newFiles: UppyFile<M, B>[]
  uploadStartedFiles: UppyFile<M, B>[]
  completeFiles: UppyFile<M, B>[]
  erroredFiles: UppyFile<M, B>[]
  inProgressFiles: UppyFile<M, B>[]
  inProgressNotPausedFiles: UppyFile<M, B>[]
  processingFiles: UppyFile<M, B>[]
  isUploadStarted: boolean
  isAllComplete: boolean
  isAllPaused: boolean
  totalFileCount: number
  totalProgress: number
  allowNewUpload: boolean
  acquirers: TargetWithRender[]
  theme: string
  disabled: boolean
  disableLocalFiles: boolean
  direction: UIPluginOptions['direction']
  activePickerPanel: DashboardState<M, B>['activePickerPanel']
  showFileEditor: boolean
  saveFileEditor: () => void
  closeFileEditor: () => void
  disableInteractiveElements: (disable: boolean) => void
  animateOpenClose: boolean
  isClosing: boolean
  progressindicators: TargetWithRender[]
  editors: TargetWithRender[]
  autoProceed: boolean
  id: string
  closeModal: () => void
  handleClickOutside: () => void
  handleInputChange: (event: TargetedEvent<HTMLInputElement, Event>) => void
  handlePaste: (event: ClipboardEvent) => void
  inline: boolean
  showPanel: (id: string) => void
  hideAllPanels: () => void
  i18n: I18n
  i18nArray: Translator['translateArray']
  uppy: Uppy<M, B>
  note: string | null
  recoveredState: State<M, B>['recoveredState']
  metaFields: DashboardState<M, B>['metaFields']
  resumableUploads: boolean
  individualCancellation: boolean
  isMobileDevice?: boolean
  fileCardFor: string | null
  toggleFileCard: (show: boolean, fileID: string) => void
  toggleAddFilesPanel: (show: boolean) => void
  showAddFilesPanel: boolean
  saveFileCard: (meta: M, fileID: string) => void
  openFileEditor: (file: UppyFile<M, B>) => void
  canEditFile: (file: UppyFile<M, B>) => boolean
  width: string | number
  height: string | number
  showLinkToFileUploadResult: boolean
  fileManagerSelectionType: string
  proudlyDisplayPoweredByUppy: boolean
  hideCancelButton: boolean
  hideRetryButton: boolean
  hidePauseResumeButton: boolean
  showRemoveButtonAfterComplete: boolean
  containerWidth: number
  containerHeight: number
  areInsidesReadyToBeVisible: boolean
  parentElement: HTMLElement | null
  allowedFileTypes: string[] | null
  maxNumberOfFiles: number | null
  requiredMetaFields: any
  showSelectedFiles: boolean
  showNativePhotoCameraButton: boolean
  showNativeVideoCameraButton: boolean
  nativeCameraFacingMode: 'user' | 'environment' | ''
  singleFileFullScreen: boolean
  handleCancelRestore: () => void
  handleRequestThumbnail: (file: UppyFile<M, B>) => void
  handleCancelThumbnail: (file: UppyFile<M, B>) => void
  isDraggingOver: boolean
  handleDragOver: (event: DragEvent) => void
  handleDragLeave: (event: DragEvent) => void
  handleDrop: (event: DragEvent) => void
}

export default function Dashboard<M extends Meta, B extends Body>(
  props: DashboardUIProps<M, B>,
) {
  const isNoFiles = props.totalFileCount === 0
  const isSingleFile = props.totalFileCount === 1
  const isSizeMD = props.containerWidth > WIDTH_MD
  const isSizeHeightMD = props.containerHeight > HEIGHT_MD

  const dashboardClassName = classNames({
    'uppy-Dashboard': true,
    'uppy-Dashboard--isDisabled': props.disabled,
    'uppy-Dashboard--animateOpenClose': props.animateOpenClose,
    'uppy-Dashboard--isClosing': props.isClosing,
    'uppy-Dashboard--isDraggingOver': props.isDraggingOver,
    'uppy-Dashboard--modal': !props.inline,
    'uppy-size--md': props.containerWidth > WIDTH_MD,
    'uppy-size--lg': props.containerWidth > WIDTH_LG,
    'uppy-size--xl': props.containerWidth > WIDTH_XL,
    'uppy-size--height-md': props.containerHeight > HEIGHT_MD,
    // We might want to enable this in the future
    // 'uppy-size--height-lg': props.containerHeight > HEIGHT_LG,
    // 'uppy-size--height-xl': props.containerHeight > HEIGHT_XL,
    'uppy-Dashboard--isAddFilesPanelVisible': props.showAddFilesPanel,
    'uppy-Dashboard--isInnerWrapVisible': props.areInsidesReadyToBeVisible,
    // Only enable “centered single file” mode when Dashboard is tall enough
    'uppy-Dashboard--singleFile':
      props.singleFileFullScreen && isSingleFile && isSizeHeightMD,
  })

  // Important: keep these in sync with the percent width values in `src/components/FileItem/index.scss`.
  let itemsPerRow = 1 // mobile
  if (props.containerWidth > WIDTH_XL) {
    itemsPerRow = 5
  } else if (props.containerWidth > WIDTH_LG) {
    itemsPerRow = 4
  } else if (props.containerWidth > WIDTH_MD) {
    itemsPerRow = 3
  }

  const showFileList = props.showSelectedFiles && !isNoFiles

  const numberOfFilesForRecovery = props.recoveredState
    ? Object.keys(props.recoveredState.files).length
    : null
  const numberOfGhosts = props.files
    ? Object.keys(props.files).filter((fileID) => props.files[fileID].isGhost)
        .length
    : 0

  const renderRestoredText = () => {
    if (numberOfGhosts > 0) {
      return props.i18n('recoveredXFiles', {
        smart_count: numberOfGhosts,
      })
    }

    return props.i18n('recoveredAllFiles')
  }

  const dashboard = (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: ...
    <div
      className={dashboardClassName}
      data-uppy-theme={props.theme}
      data-uppy-num-acquirers={props.acquirers.length}
      data-uppy-drag-drop-supported={
        !props.disableLocalFiles && isDragDropSupported()
      }
      aria-hidden={props.inline ? 'false' : props.isHidden}
      aria-disabled={props.disabled}
      aria-label={
        !props.inline
          ? props.i18n('dashboardWindowTitle')
          : props.i18n('dashboardTitle')
      }
      onPaste={props.handlePaste}
      onDragOver={props.handleDragOver}
      onDragLeave={props.handleDragLeave}
      onDrop={props.handleDrop}
    >
      <div
        aria-hidden="true"
        className="uppy-Dashboard-overlay"
        tabIndex={-1}
        onClick={props.handleClickOutside}
      />

      <div
        className="uppy-Dashboard-inner"
        role={props.inline ? undefined : 'dialog'}
        style={{
          width: props.inline && props.width ? props.width : '',
          height: props.inline && props.height ? props.height : '',
        }}
      >
        {!props.inline ? (
          <button
            className="uppy-u-reset uppy-Dashboard-close"
            type="button"
            aria-label={props.i18n('closeModal')}
            title={props.i18n('closeModal')}
            onClick={props.closeModal}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        ) : null}

        <div className="uppy-Dashboard-innerWrap">
          <div className="uppy-Dashboard-dropFilesHereHint">
            {props.i18n('dropHint')}
          </div>

          {showFileList && <PanelTopBar {...props} />}

          {numberOfFilesForRecovery && (
            <div className="uppy-Dashboard-serviceMsg">
              <svg
                className="uppy-Dashboard-serviceMsg-icon"
                aria-hidden="true"
                focusable="false"
                width="21"
                height="16"
                viewBox="0 0 24 19"
              >
                <g transform="translate(0 -1)" fill="none" fillRule="evenodd">
                  <path
                    d="M12.857 1.43l10.234 17.056A1 1 0 0122.234 20H1.766a1 1 0 01-.857-1.514L11.143 1.429a1 1 0 011.714 0z"
                    fill="#FFD300"
                  />
                  <path fill="#000" d="M11 6h2l-.3 8h-1.4z" />
                  <circle fill="#000" cx="12" cy="17" r="1" />
                </g>
              </svg>
              <strong className="uppy-Dashboard-serviceMsg-title">
                {props.i18n('sessionRestored')}
              </strong>
              <div className="uppy-Dashboard-serviceMsg-text">
                {renderRestoredText()}
              </div>
            </div>
          )}

          {showFileList ? (
            <FileList
              id={props.id}
              i18n={props.i18n}
              uppy={props.uppy}
              files={props.files}
              resumableUploads={props.resumableUploads}
              hideRetryButton={props.hideRetryButton}
              hidePauseResumeButton={props.hidePauseResumeButton}
              hideCancelButton={props.hideCancelButton}
              showLinkToFileUploadResult={props.showLinkToFileUploadResult}
              showRemoveButtonAfterComplete={
                props.showRemoveButtonAfterComplete
              }
              metaFields={props.metaFields}
              toggleFileCard={props.toggleFileCard}
              handleRequestThumbnail={props.handleRequestThumbnail}
              handleCancelThumbnail={props.handleCancelThumbnail}
              recoveredState={props.recoveredState}
              individualCancellation={props.individualCancellation}
              openFileEditor={props.openFileEditor}
              canEditFile={props.canEditFile}
              toggleAddFilesPanel={props.toggleAddFilesPanel}
              isSingleFile={isSingleFile}
              itemsPerRow={itemsPerRow}
              containerWidth={props.containerWidth}
              containerHeight={props.containerHeight}
            />
          ) : (
            <AddFiles
              i18n={props.i18n}
              i18nArray={props.i18nArray}
              acquirers={props.acquirers}
              handleInputChange={props.handleInputChange}
              maxNumberOfFiles={props.maxNumberOfFiles}
              allowedFileTypes={props.allowedFileTypes}
              showNativePhotoCameraButton={props.showNativePhotoCameraButton}
              showNativeVideoCameraButton={props.showNativeVideoCameraButton}
              nativeCameraFacingMode={props.nativeCameraFacingMode}
              showPanel={props.showPanel}
              activePickerPanel={props.activePickerPanel}
              disableLocalFiles={props.disableLocalFiles}
              fileManagerSelectionType={props.fileManagerSelectionType}
              note={props.note}
              proudlyDisplayPoweredByUppy={props.proudlyDisplayPoweredByUppy}
            />
          )}

          <Slide>
            {props.showAddFilesPanel ? (
              <AddFilesPanel key="AddFiles" {...props} isSizeMD={isSizeMD} />
            ) : null}
          </Slide>

          <Slide>
            {props.fileCardFor ? <FileCard key="FileCard" {...props} /> : null}
          </Slide>

          <Slide>
            {props.activePickerPanel ? (
              <PickerPanelContent key="Picker" {...props} />
            ) : null}
          </Slide>

          <Slide>
            {props.showFileEditor ? (
              <EditorPanel key="Editor" {...props} />
            ) : null}
          </Slide>

          <div className="uppy-Dashboard-progressindicators">
            {props.progressindicators.map((target: TargetWithRender) => {
              // TODO
              // Here we're telling typescript all `this.type = 'progressindicator'` plugins inherit from `UIPlugin`
              // This is factually true in Uppy right now, but maybe it doesn't have to be
              return (
                props.uppy.getPlugin(target.id) as UIPlugin<any, any, any>
              ).render(props.state)
            })}
          </div>
        </div>
      </div>
    </div>
  )

  return dashboard
}
