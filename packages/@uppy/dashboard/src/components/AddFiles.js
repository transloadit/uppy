const { iconMyDevice } = require('./icons')
const { h, Component } = require('preact')

class AddFiles extends Component {
  triggerFileInputClick = () => {
    this.fileInput.click()
  }

  onFileInputChange = (event) => {
    this.props.handleInputChange(event)

    // We clear the input after a file is selected, because otherwise
    // change event is not fired in Chrome and Safari when a file
    // with the same name is selected.
    // ___Why not use value="" on <input/> instead?
    //    Because if we use that method of clearing the input,
    //    Chrome will not trigger change if we drop the same file twice (Issue #768).
    event.target.value = null
  }

  renderPoweredByUppy () {
    const uppyBranding = (
      <span>
        <svg aria-hidden="true" focusable="false" class="UppyIcon uppy-Dashboard-poweredByIcon" width="11" height="11" viewBox="0 0 11 11">
          <path d="M7.365 10.5l-.01-4.045h2.612L5.5.806l-4.467 5.65h2.604l.01 4.044h3.718z" fill-rule="evenodd" />
        </svg>
        <span class="uppy-Dashboard-poweredByUppy">Uppy</span>
      </span>
    )

    // Support both the old word-order-insensitive string `poweredBy` and the new word-order-sensitive string `poweredBy2`
    const linkText = this.props.i18nArray('poweredBy2', {
      backwardsCompat: this.props.i18n('poweredBy'),
      uppy: uppyBranding
    })

    return (
      <a
        tabindex="-1"
        href="https://uppy.io"
        rel="noreferrer noopener"
        target="_blank"
        class="uppy-Dashboard-poweredBy"
      >
        {linkText}
      </a>
    )
  }

  renderCloudIcon = () => {
    return (
      <svg class="uppy-Dashboard-dropFilesIcon" aria-hidden="true" width="64" height="45" viewBox="0 0 64 45" xmlns="http://www.w3.org/2000/svg">
        <path d="M38 44.932V31h8L33 15 20 31h8v13.932H13.538C6.075 44.932 0 38.774 0 31.202c0-6.1 4.06-11.512 9.873-13.162l.005-.017c.345-5.8 5.248-10.534 10.922-10.534.502 0 1.164.017 1.868.16C25.9 2.85 31.225 0 36.923 0c9.5 0 17.23 7.838 17.23 17.473l-.011.565.012.002C60.039 19.685 64 24.975 64 31.203c0 7.57-6.075 13.729-13.538 13.729H38z" fill="#E2E2E2" fill-rule="nonzero" />
      </svg>
    )
  }

  renderHiddenFileInput = () => {
    return (
      <input
        class="uppy-Dashboard-input"
        hidden
        aria-hidden="true"
        tabindex={-1}
        type="file"
        name="files[]"
        multiple={this.props.maxNumberOfFiles !== 1}
        onchange={this.onFileInputChange}
        accept={this.props.allowedFileTypes}
        ref={(ref) => { this.fileInput = ref }}
      />
    )
  }

  renderMyDeviceAcquirer = () => {
    return (
      <div class="uppy-DashboardTab" role="presentation">
        <button
          type="button"
          class="uppy-DashboardTab-btn"
          role="tab"
          tabindex={0}
          data-uppy-super-focusable
          onclick={this.triggerFileInputClick}
        >
          {iconMyDevice()}
          <div class="uppy-DashboardTab-name">{this.props.i18n('myDevice')}</div>
        </button>
      </div>
    )
  }

  renderDropPasteBrowseTagline = () => {
    const numberOfAcquirers = this.props.acquirers.length
    const browse =
      <button
        type="button"
        class="uppy-u-reset uppy-Dashboard-browse"
        onclick={this.triggerFileInputClick}
        data-uppy-super-focusable={numberOfAcquirers === 0}
      >
        {this.props.i18n('browse')}
      </button>

    const renderDropFilesSubtitle = (numberOfAcquirers) => {
      if (numberOfAcquirers > 0) {
        return this.props.i18nArray('dropPasteImport', { browse })
      }
      return this.props.i18nArray('dropPaste', { browse })
    }

    return (
      <div class="uppy-Dashboard-dropFilesTitleGroup">
        <div class="uppy-Dashboard-dropFilesTitle">
          {renderDropFilesSubtitle(numberOfAcquirers)}
        </div>
      </div>
    )
  }

  renderBrowseButton = () => {
    return (
      <button
        type="button"
        class="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Dashboard-browseBtn"
        onclick={this.triggerFileInputClick}
        data-uppy-super-focusable
      >
        Browse My Device
      </button>
    )
  }

  renderAcquirer = (acquirer) => {
    return (
      <div class="uppy-DashboardTab" role="presentation">
        <button
          type="button"
          class="uppy-DashboardTab-btn"
          role="tab"
          tabindex={0}
          aria-controls={`uppy-DashboardContent-panel--${acquirer.id}`}
          aria-selected={this.props.activePickerPanel.id === acquirer.id}
          data-uppy-super-focusable
          onclick={() => this.props.showPanel(acquirer.id)}
        >
          {acquirer.icon()}
          <div class="uppy-DashboardTab-name">{acquirer.name}</div>
        </button>
      </div>
    )
  }

  renderAcquirers = (acquirers) => {
    // Group last two buttons, so we don’t end up with
    // just one button on a new line
    const acquirersWithoutLastTwo = [...acquirers]
    const lastTwoAcquirers = acquirersWithoutLastTwo.splice(acquirers.length - 2, acquirers.length)

    return (
      <div class="uppy-DashboardTabs-list" role="tablist">
        {this.renderMyDeviceAcquirer()}
        {acquirersWithoutLastTwo.map((acquirer) => this.renderAcquirer(acquirer))}
        <span role="presentation" style="white-space: nowrap;">
          {lastTwoAcquirers.map((acquirer) => this.renderAcquirer(acquirer))}
        </span>
      </div>
    )
  }

  render () {
    return (
      <div class="uppy-DashboardAddFiles">
        {this.renderHiddenFileInput()}
        <div class="uppy-DashboardTabs">
          {this.renderDropPasteBrowseTagline()}
          {this.props.acquirers.length > 0 && this.renderAcquirers(this.props.acquirers)}
          <div class="uppy-DashboardAddFiles-info">
            {this.props.note && <div class="uppy-Dashboard-note">{this.props.note}</div>}
            {this.props.proudlyDisplayPoweredByUppy && this.renderPoweredByUppy(this.props)}
          </div>
        </div>
      </div>
    )
  }
}

module.exports = AddFiles
