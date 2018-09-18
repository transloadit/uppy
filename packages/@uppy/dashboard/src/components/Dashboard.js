const FileList = require('./FileList')
const AddFiles = require('./AddFiles')
const AddFilesPanel = require('./AddFilesPanel')
const PanelContent = require('./PanelContent')
const PanelTopBar = require('./PanelTopBar')
const FileCard = require('./FileCard')
const classNames = require('classnames')
const isTouchDevice = require('@uppy/utils/lib/isTouchDevice')
const { h } = require('preact')
const PreactCSSTransitionGroup = require('preact-css-transition-group')

// http://dev.edenspiekermann.com/2016/02/11/introducing-accessible-modal-dialog
// https://github.com/ghosh/micromodal

module.exports = function Dashboard (props) {
  // if (!props.inline && props.modal.isHidden) {
  //   return <span />
  // }

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
    { 'uppy-Dashboard--isAddFilesPanelVisible': props.showAddFilesPanel }
  )

  return (
    <div class={dashboardClassName}
      aria-hidden={props.inline ? 'false' : props.modal.isHidden}
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
        <button class="uppy-Dashboard-close"
          type="button"
          aria-label={props.i18n('closeModal')}
          title={props.i18n('closeModal')}
          onclick={props.closeModal}>
          <span aria-hidden="true">&times;</span>
        </button>

        <div class="uppy-Dashboard-innerWrap">
          { (!noFiles && props.showSelectedFiles) && <PanelTopBar {...props} /> }

          { props.showSelectedFiles ? (
            noFiles ? <AddFiles {...props} /> : <FileList {...props} />
          ) : (
            <AddFiles {...props} />
          )}

          <PreactCSSTransitionGroup
            transitionName="uppy-transition-slideDownUp"
            transitionEnterTimeout={250}
            transitionLeaveTimeout={250}>
            { props.showAddFilesPanel ? <AddFilesPanel key="AddFilesPanel" {...props} /> : null }
          </PreactCSSTransitionGroup>

          <PreactCSSTransitionGroup
            transitionName="uppy-transition-slideDownUp"
            transitionEnterTimeout={250}
            transitionLeaveTimeout={250}>
            { props.fileCardFor ? <FileCard key="FileCard" {...props} /> : null }
          </PreactCSSTransitionGroup>

          <PreactCSSTransitionGroup
            transitionName="uppy-transition-slideDownUp"
            transitionEnterTimeout={250}
            transitionLeaveTimeout={250}>
            { props.activePanel ? <PanelContent key="PanelContent" {...props} /> : null }
          </PreactCSSTransitionGroup>

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
