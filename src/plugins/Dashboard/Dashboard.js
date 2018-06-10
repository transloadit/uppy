const FileList = require('./FileList')
const Tabs = require('./Tabs')
const FileCard = require('./FileCard')
const classNames = require('classnames')
const { isTouchDevice } = require('../../core/Utils')
const { h, Component } = require('preact')

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

module.exports = class Dashboard extends Component {
  componentDidMount () {
    // const width = this.dashboardInnerEl.offsetWidth
    // this.props.updateDashboardElWidth()
  }

  render () {
    const dashboardClassName = classNames(
      { 'uppy-Root': this.props.isTargetDOMEl },
      'uppy-Dashboard',
      { 'Uppy--isTouchDevice': isTouchDevice() },
      { 'uppy-Dashboard--animateOpenClose': this.props.animateOpenClose },
      { 'uppy-Dashboard--isClosing': this.props.isClosing },
      { 'uppy-Dashboard--modal': !this.props.inline },
      { 'uppy-Dashboard--wide': this.props.isWide }
    )

    return (
      <div class={dashboardClassName}
        aria-hidden={this.props.inline ? 'false' : this.props.modal.isHidden}
        aria-label={!this.props.inline ? this.props.i18n('dashboardWindowTitle') : this.props.i18n('dashboardTitle')}
        onpaste={this.props.handlePaste}>

        <div class="uppy-Dashboard-overlay" tabindex={-1} onclick={this.props.handleClickOutside} />

        <div class="uppy-Dashboard-inner"
          aria-modal={!this.props.inline && 'true'}
          role={!this.props.inline && 'dialog'}
          ref={(el) => {
            this.dashboardInnerEl = el
          }}
          style={{
            width: this.props.inline && this.props.width ? this.props.width : '',
            height: this.props.inline && this.props.height ? this.props.height : ''
          }}>
          <button class="uppy-Dashboard-close"
            type="button"
            aria-label={this.props.i18n('closeModal')}
            title={this.props.i18n('closeModal')}
            onclick={this.props.closeModal}>
            <span aria-hidden="true">&times;</span>
          </button>

          <div class="uppy-Dashboard-innerWrap">
            <Tabs {...this.props} />

            <FileCard {...this.props} />

            <div class="uppy-Dashboard-filesContainer">
              <FileList {...this.props} />
            </div>

            <div class="uppy-DashboardContent-panel"
              role="tabpanel"
              id={this.props.activePanel && `uppy-DashboardContent-panel--${this.props.activePanel.id}`}
              aria-hidden={this.props.activePanel ? 'false' : 'true'}>
              {this.props.activePanel && <PanelContent {...this.props} />}
            </div>

            <div class="uppy-Dashboard-progressindicators">
              {this.props.progressindicators.map((target) => {
                return this.props.getPlugin(target.id).render(this.props.state)
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }
}
