const { localIcon } = require('./icons')
const { h, Component } = require('preact')

class AddFiles extends Component {
  constructor (props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
    this.renderPoweredByUppy = this.renderPoweredByUppy.bind(this)
    this.renderFileInput = this.renderFileInput.bind(this)
    this.renderDropPasteBrowseTagline = this.renderDropPasteBrowseTagline.bind(this)
    this.renderMyDeviceAcquirer = this.renderMyDeviceAcquirer.bind(this)
    this.renderAcquirer = this.renderAcquirer.bind(this)
  }

  handleClick (ev) {
    this.input.click()
  }

  renderPoweredByUppy () {
    return <a tabindex="-1" href="https://uppy.io" rel="noreferrer noopener" target="_blank" class="uppy-Dashboard-poweredBy">
      {this.props.i18n('poweredBy')}
      <svg aria-hidden="true" class="UppyIcon uppy-Dashboard-poweredByIcon" width="11" height="11" viewBox="0 0 11 11">
        <path d="M7.365 10.5l-.01-4.045h2.612L5.5.806l-4.467 5.65h2.604l.01 4.044h3.718z" fill-rule="evenodd" />
      </svg>
      <span class="uppy-Dashboard-poweredByUppy">Uppy</span>
    </a>
  }

  renderFileInput () {
    return <input class="uppy-Dashboard-input"
      hidden
      aria-hidden="true"
      tabindex={-1}
      type="file"
      name="files[]"
      multiple={this.props.maxNumberOfFiles !== 1}
      onchange={this.props.handleInputChange}
      accept={this.props.allowedFileTypes}
      value=""
      ref={(input) => { this.input = input }} />
  }

  renderDropPasteBrowseTagline () {
    const browse =
      <button type="button" class="uppy-Dashboard-browse" onclick={this.handleClick}>
        {this.props.i18n('browse')}
      </button>

    return <div class="uppy-Dashboard-dropFilesTitle">
      {this.props.acquirers.length === 0
        ? this.props.i18nArray('dropPaste', { browse })
        : this.props.i18nArray('dropPasteImport', { browse })
      }
      {this.renderFileInput()}
    </div>
  }

  renderMyDeviceAcquirer () {
    return <div class="uppy-DashboardTab" role="presentation">
      <button type="button"
        class="uppy-DashboardTab-btn"
        role="tab"
        tabindex={0}
        onclick={this.handleClick}>
        {localIcon()}
        <div class="uppy-DashboardTab-name">{this.props.i18n('myDevice')}</div>
      </button>
      {this.renderFileInput()}
    </div>
  }

  renderAcquirer (acquirer) {
    return <div class="uppy-DashboardTab" role="presentation">
      <button type="button"
        class="uppy-DashboardTab-btn"
        role="tab"
        tabindex={0}
        aria-controls={`uppy-DashboardContent-panel--${acquirer.id}`}
        aria-selected={this.props.activePickerPanel.id === acquirer.id}
        onclick={() => this.props.showPanel(acquirer.id)}>
        {acquirer.icon()}
        <div class="uppy-DashboardTab-name">{acquirer.name}</div>
      </button>
    </div>
  }

  render () {
    return (
      <div class="uppy-DashboardAddFiles">
        <div class="uppy-DashboardTabs">
          {this.renderDropPasteBrowseTagline()}
          {
            this.props.acquirers.length > 0 &&
            <div class="uppy-DashboardTabs-list" role="tablist">
              {this.renderMyDeviceAcquirer()}
              {this.props.acquirers.map((acquirer) =>
                this.renderAcquirer(acquirer)
              )}
            </div>
          }
        </div>
        <div class="uppy-DashboardAddFiles-info">
          { this.props.note && <div class="uppy-Dashboard-note">{this.props.note}</div> }
          { this.props.proudlyDisplayPoweredByUppy && this.renderPoweredByUppy(this.props) }
        </div>
      </div>
    )
  }
}

module.exports = AddFiles
