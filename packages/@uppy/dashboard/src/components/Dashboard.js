const FileList = require('./FileList')
const AddFiles = require('./AddFiles')
const AddFilesPanel = require('./AddFilesPanel')
const PickerPanelContent = require('./PickerPanelContent')
const PanelTopBar = require('./PickerPanelTopBar')
const FileCard = require('./FileCard')
const classNames = require('classnames')
const isTouchDevice = require('@uppy/utils/lib/isTouchDevice')
const { h } = require('preact')
const PreactCSSTransitionGroup = require('preact-css-transition-group')

// http://dev.edenspiekermann.com/2016/02/11/introducing-accessible-modal-dialog
// https://github.com/ghosh/micromodal

function TransitionWrapper (props) {
  return (
    <PreactCSSTransitionGroup
      transitionName="uppy-transition-slideDownUp"
      transitionEnterTimeout={250}
      transitionLeaveTimeout={250}>
      {props.children}
    </PreactCSSTransitionGroup>
  )
}

module.exports = function Dashboard (props) {
  const noFiles = props.totalFileCount === 0

  const dashboardClassName = classNames(
    { 'uppy-Root': props.isTargetDOMEl },
    'uppy-Dashboard',
    { 'Uppy--isTouchDevice': isTouchDevice() },
    { 'uppy-Dashboard--animateOpenClose': props.animateOpenClose },
    { 'uppy-Dashboard--isClosing': props.isClosing },
    { 'uppy-Dashboard--modal': !props.inline },
    { 'uppy-size--md': props.containerWidth > 576 },
    { 'uppy-size--lg': props.containerWidth > 700 },
    { 'uppy-size--xl': props.containerWidth > 900 },
    { 'uppy-Dashboard--isAddFilesPanelVisible': props.showAddFilesPanel },
    { 'uppy-Dashboard--isInnerWrapVisible': props.areInsidesReadyToBeVisible }
  )

  return (
    <div class={dashboardClassName}
      aria-hidden={props.inline ? 'false' : props.isHidden}
      aria-label={!props.inline ? props.i18n('dashboardWindowTitle') : props.i18n('dashboardTitle')}
      onpaste={props.handlePaste}>

      <div class="uppy-Dashboard-overlay" tabindex={-1} onclick={props.handleClickOutside} />

      <div class="uppy-Dashboard-inner"
        aria-modal={!props.inline && 'true'}
        role={!props.inline && 'dialog'}
        style={{
          width: props.inline && props.width ? props.width : '',
          height: props.inline && props.height ? props.height : ''
        }}>

        {!props.inline
          ? <button class="uppy-u-reset uppy-Dashboard-close"
            type="button"
            aria-label={props.i18n('closeModal')}
            title={props.i18n('closeModal')}
            onclick={props.closeModal}>
            <span aria-hidden="true">&times;</span>
          </button>
            : null
          }

        <div class="uppy-Dashboard-innerWrap">
          { (!noFiles && props.showSelectedFiles) && <PanelTopBar {...props} /> }

          { props.showSelectedFiles ? (
            noFiles ? <AddFiles {...props} /> : <FileList {...props} />
          ) : (
            <AddFiles {...props} />
          )}

          <TransitionWrapper>
            { props.showAddFilesPanel ? <AddFilesPanel key="AddFilesPanel" {...props} /> : null }
          </TransitionWrapper>

          <TransitionWrapper>
            { props.fileCardFor ? <FileCard key="FileCard" {...props} /> : null }
          </TransitionWrapper>

          <TransitionWrapper>
            { props.activePickerPanel ? <PickerPanelContent key="PickerPanelContent" {...props} /> : null }
          </TransitionWrapper>

          <div class="uppy-Dashboard-progressindicators">
            {props.progressindicators.map((target) => {
              return props.getPlugin(target.id).render(props.state)
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
