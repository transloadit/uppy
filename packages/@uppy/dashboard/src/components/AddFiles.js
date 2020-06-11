const { h, Component } = require('preact')

class AddFiles extends Component {
  triggerFileInputClick = () => {
    this.fileInput.click()
  }

  triggerFolderInputClick = () => {
    this.folderInput.click()
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
        <svg aria-hidden="true" focusable="false" class="uppy-c-icon uppy-Dashboard-poweredByIcon" width="11" height="11" viewBox="0 0 11 11">
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

  renderHiddenFolderInput = () => {
    return (
      <input
        class="uppy-Dashboard-input"
        hidden
        aria-hidden="true"
        tabindex={-1}
        webkitdirectory="true"
        type="file"
        name="files[]"
        multiple={this.props.maxNumberOfFiles !== 1}
        onchange={this.onFileInputChange}
        accept={this.props.allowedFileTypes}
        ref={(ref) => { this.folderInput = ref }}
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
          <svg aria-hidden="true" focusable="false" width="32" height="32" viewBox="0 0 32 32">
            <g fill="none" fill-rule="evenodd">
              <rect width="32" height="32" rx="16" fill="#2275D7" />
              <path d="M21.973 21.152H9.863l-1.108-5.087h14.464l-1.246 5.087zM9.935 11.37h3.958l.886 1.444a.673.673 0 0 0 .585.316h6.506v1.37H9.935v-3.13zm14.898 3.44a.793.793 0 0 0-.616-.31h-.978v-2.126c0-.379-.275-.613-.653-.613H15.75l-.886-1.445a.673.673 0 0 0-.585-.316H9.232c-.378 0-.667.209-.667.587V14.5h-.782a.793.793 0 0 0-.61.303.795.795 0 0 0-.155.663l1.45 6.633c.078.36.396.618.764.618h13.354c.36 0 .674-.246.76-.595l1.631-6.636a.795.795 0 0 0-.144-.675z" fill="#FFF" />
            </g>
          </svg>
          <div class="uppy-DashboardTab-name">{this.props.i18n('myDevice')}</div>
        </button>
      </div>
    )
  }

  renderBrowseFileButton = () => {
    const numberOfAcquirers = this.props.acquirers.length
    return (
      <button
        type="button"
        class="uppy-u-reset uppy-Dashboard-browse"
        onclick={this.triggerFileInputClick}
        data-uppy-super-focusable={numberOfAcquirers === 0}
      >
        browse files
      </button>
    )
  }

  renderBrowseFolderButton = () => {
    const numberOfAcquirers = this.props.acquirers.length
    return (
      <button
        type="button"
        class="uppy-u-reset uppy-Dashboard-browse"
        onclick={this.triggerFolderInputClick}
        data-uppy-super-focusable={numberOfAcquirers === 0}
      >
        browse folders
      </button>
    )
  }

  renderDropPasteBrowseTagline = () => {
    const numberOfAcquirers = this.props.acquirers.length
    const browse = (
      <span>
        {!(this.props.browserAllowFiles && this.props.browserAllowFolders) && 'or, '}
        {(this.props.browserAllowFiles) && this.renderBrowseFileButton()}
        {(this.props.browserAllowFiles && this.props.browserAllowFolders) && ' or, '}
        {this.props.browserAllowFolders && this.renderBrowseFolderButton()}
      </span>
    )

    return (
      <div class="uppy-Dashboard-AddFiles-title">
        {
          numberOfAcquirers > 0
            ? this.props.i18nArray('dropPasteImport', { browse })
            : this.props.i18nArray('dropPaste', { browse })
        }
      </div>
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
      <div class="uppy-Dashboard-AddFiles-list" role="tablist">
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
      <div class="uppy-Dashboard-AddFiles">
        {this.renderHiddenFileInput()}
        {this.renderHiddenFolderInput()}
        {this.renderDropPasteBrowseTagline()}
        {this.props.acquirers.length > 0 && this.renderAcquirers(this.props.acquirers)}
        <div class="uppy-Dashboard-AddFiles-info">
          {this.props.note && <div class="uppy-Dashboard-note">{this.props.note}</div>}
          {this.props.proudlyDisplayPoweredByUppy && this.renderPoweredByUppy(this.props)}
        </div>
      </div>
    )
  }
}

module.exports = AddFiles
