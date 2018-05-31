const FileList = require('./FileList')
const Tabs = require('./Tabs')
const FileCard = require('./FileCard')
const classNames = require('classnames')
const { isTouchDevice } = require('../../core/Utils')
const { h } = require('preact')

// http://dev.edenspiekermann.com/2016/02/11/introducing-accessible-modal-dialog
// https://github.com/ghosh/micromodal

const PanelContent = (props) => {
  return <div style={{ width: '100%', height: '100%' }}>
    <div class="uppy-DashboardContent-bar">
      <div class="uppy-DashboardContent-title" role="heading" aria-level="h1">
        {props.i18n('importFrom', { name: props.activePanel.name })}
      </div>
      <button class="uppy-DashboardContent-back"
        type="button"
        onclick={props.hideAllPanels}>{props.i18n('done')}</button>
    </div>
    {props.getPlugin(props.activePanel.id).render(props.state)}
  </div>
}

const poweredByUppy = (props) => {
  return <a href="https://uppy.io" rel="noreferrer noopener" target="_blank" class="uppy-Dashboard-poweredBy">Powered by <svg aria-hidden="true" class="UppyIcon uppy-Dashboard-poweredByIcon" width="11" height="11" viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.365 10.5l-.01-4.045h2.612L5.5.806l-4.467 5.65h2.604l.01 4.044h3.718z" fill-rule="evenodd" />
  </svg><span class="uppy-Dashboard-poweredByUppy">Uppy</span></a>
}

module.exports = function Dashboard (props) {
  const dashboardClassName = classNames(
    { 'uppy-Root': props.isTargetDOMEl },
    'uppy-Dashboard',
    { 'Uppy--isTouchDevice': isTouchDevice() },
    { 'uppy-Dashboard--modal': !props.inline },
    { 'uppy-Dashboard--wide': props.isWide }
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
          <Tabs {...props} />

          <FileCard {...props} />

          <div class="uppy-Dashboard-filesContainer">
            <FileList {...props} />
          </div>

          <div class="uppy-DashboardContent-panel"
            role="tabpanel"
            id={props.activePanel && `uppy-DashboardContent-panel--${props.activePanel.id}`}
            aria-hidden={props.activePanel ? 'false' : 'true'}>
            {props.activePanel && <PanelContent {...props} />}
          </div>

          <div class="uppy-Dashboard-progressindicators">
            {props.progressindicators.map((target) => {
              return props.getPlugin(target.id).render(props.state)
            })}
          </div>
        </div>

        { props.proudlyDisplayPoweredByUppy && poweredByUppy(props) }

      </div>
    </div>
  )
}
