const FileList = require('./FileList')
const AddFiles = require('./AddFiles')
const AddFilesPanel = require('./AddFilesPanel')
const PickerPanelContent = require('./PickerPanelContent')
const EditorPanel = require('./EditorPanel')
const PanelTopBar = require('./PickerPanelTopBar')
const FileCard = require('./FileCard')
const Slide = require('./Slide')
const classNames = require('classnames')
const isDragDropSupported = require('@uppy/utils/lib/isDragDropSupported')
const { h } = require('preact')

// http://dev.edenspiekermann.com/2016/02/11/introducing-accessible-modal-dialog
// https://github.com/ghosh/micromodal

const WIDTH_XL = 900
const WIDTH_LG = 700
const WIDTH_MD = 576
const HEIGHT_MD = 400

module.exports = function Dashboard (props) {
  const noFiles = props.totalFileCount === 0
  const isSizeMD = props.containerWidth > WIDTH_MD

  const wrapperClassName = classNames({
    'uppy-Root': props.isTargetDOMEl
  })

  const dashboardClassName = classNames({
    'uppy-Dashboard': true,
    'uppy-Dashboard--animateOpenClose': props.animateOpenClose,
    'uppy-Dashboard--isClosing': props.isClosing,
    'uppy-Dashboard--isDraggingOver': props.isDraggingOver,
    'uppy-Dashboard--modal': !props.inline,
    'uppy-size--md': props.containerWidth > WIDTH_MD,
    'uppy-size--lg': props.containerWidth > WIDTH_LG,
    'uppy-size--xl': props.containerWidth > WIDTH_XL,
    'uppy-size--height-md': props.containerHeight > HEIGHT_MD,
    'uppy-Dashboard--isAddFilesPanelVisible': props.showAddFilesPanel,
    'uppy-Dashboard--isInnerWrapVisible': props.areInsidesReadyToBeVisible
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

  const showFileList = props.showSelectedFiles && !noFiles

  const numberOfFilesForRecovery = props.recoveryState ? Object.keys(props.recoveryState.files).length : null
  console.log(numberOfFilesForRecovery)

  const dashboard = (
    <div
      class={dashboardClassName}
      data-uppy-theme={props.theme}
      data-uppy-num-acquirers={props.acquirers.length}
      data-uppy-drag-drop-supported={isDragDropSupported()}
      aria-hidden={props.inline ? 'false' : props.isHidden}
      aria-label={!props.inline ? props.i18n('dashboardWindowTitle') : props.i18n('dashboardTitle')}
      onpaste={props.handlePaste}
      onDragOver={props.handleDragOver}
      onDragLeave={props.handleDragLeave}
      onDrop={props.handleDrop}
    >
      <div
        class="uppy-Dashboard-overlay"
        tabindex={-1}
        onclick={props.handleClickOutside}
      />

      <div
        class="uppy-Dashboard-inner"
        aria-modal={!props.inline && 'true'}
        role={!props.inline && 'dialog'}
        style={{
          width: props.inline && props.width ? props.width : '',
          height: props.inline && props.height ? props.height : ''
        }}
      >

        {!props.inline ? (
          <button
            class="uppy-u-reset uppy-Dashboard-close"
            type="button"
            aria-label={props.i18n('closeModal')}
            title={props.i18n('closeModal')}
            onclick={props.closeModal}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        ) : null}

        <div class="uppy-Dashboard-innerWrap">
          <div class="uppy-Dashboard-dropFilesHereHint">
            {props.i18n('dropHint')}
          </div>

          {showFileList && <PanelTopBar {...props} />}

          {numberOfFilesForRecovery ? (
            <div class="uppy-Dashboard-serviceMsg">
              <svg class="uppy-Dashboard-serviceMsg-icon" aria-hidden="true" focusable="false" width="24" height="19" viewBox="0 0 24 19">
                <g transform="translate(0 -1)" fill="none" fill-rule="evenodd">
                  <path d="M12.857 1.43l10.234 17.056A1 1 0 0122.234 20H1.766a1 1 0 01-.857-1.514L11.143 1.429a1 1 0 011.714 0z" fill="#FFD300" />
                  <path fill="#000" d="M11 6h2l-.3 8h-1.4z" />
                  <circle fill="#000" cx="12" cy="17" r="1" />
                </g>
              </svg>
              We’ve recovered {numberOfFilesForRecovery} files you’ve previousely selected. You can keep them or
              {' '}
              <button
                class="uppy-u-reset uppy-c-btn uppy-Dashboard-serviceMsg-actionBtn"
                onClick={props.cancelAll}
              >
                start over
              </button>
            </div>
          ) : null}

          {showFileList ? (
            <FileList
              {...props}
              itemsPerRow={itemsPerRow}
            />
          ) : (
            <AddFiles {...props} isSizeMD={isSizeMD} />
          )}

          <Slide>
            {props.showAddFilesPanel ? <AddFilesPanel key="AddFiles" {...props} isSizeMD={isSizeMD} /> : null}
          </Slide>

          <Slide>
            {props.fileCardFor ? <FileCard key="FileCard" {...props} /> : null}
          </Slide>

          <Slide>
            {props.activePickerPanel ? <PickerPanelContent key="Picker" {...props} /> : null}
          </Slide>

          <Slide>
            {props.showFileEditor ? <EditorPanel key="Editor" {...props} /> : null}
          </Slide>

          <div class="uppy-Dashboard-progressindicators">
            {props.progressindicators.map((target) => {
              return props.getPlugin(target.id).render(props.state)
            })}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    // Wrap it for RTL language support
    <div class={wrapperClassName} dir={props.direction}>
      {dashboard}
    </div>
  )
}
