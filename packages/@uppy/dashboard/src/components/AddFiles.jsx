import { h, Component, Fragment } from 'preact'

class AddFiles extends Component {
  triggerFileInputClick = () => {
    this.fileInput.click()
  }

  triggerFolderInputClick = () => {
    this.folderInput.click()
  }

  triggerVideoCameraInputClick = () => {
    this.mobileVideoFileInput.click()
  }

  triggerPhotoCameraInputClick = () => {
    this.mobilePhotoFileInput.click()
  }

  onFileInputChange = (event) => {
    this.props.handleInputChange(event)

    // We clear the input after a file is selected, because otherwise
    // change event is not fired in Chrome and Safari when a file
    // with the same name is selected.
    // ___Why not use value="" on <input/> instead?
    //    Because if we use that method of clearing the input,
    //    Chrome will not trigger change if we drop the same file twice (Issue #768).
    event.target.value = null // eslint-disable-line no-param-reassign
  }

  renderHiddenInput = (isFolder, refCallback) => {
    return (
      <input
        className="uppy-Dashboard-input"
        hidden
        aria-hidden="true"
        tabIndex={-1}
        webkitdirectory={isFolder}
        type="file"
        name="files[]"
        multiple={this.props.maxNumberOfFiles !== 1}
        onChange={this.onFileInputChange}
        accept={this.props.allowedFileTypes}
        ref={refCallback}
      />
    )
  }

  renderHiddenCameraInput = (type, nativeCameraFacingMode, refCallback) => {
    const typeToAccept = { photo: 'image/*', video: 'video/*' }
    const accept = typeToAccept[type]

    return (
      <input
        className="uppy-Dashboard-input"
        hidden
        aria-hidden="true"
        tabIndex={-1}
        type="file"
        name={`camera-${type}`}
        onChange={this.onFileInputChange}
        capture={nativeCameraFacingMode}
        accept={accept}
        ref={refCallback}
      />
    )
  }

  renderMyDeviceAcquirer = () => {
    return (
      <div
        className="uppy-DashboardTab"
        role="presentation"
        data-uppy-acquirer-id="MyDevice"
      >
        <button
          type="button"
          className="uppy-u-reset uppy-c-btn uppy-DashboardTab-btn"
          role="tab"
          tabIndex={0}
          data-uppy-super-focusable
          onClick={this.triggerFileInputClick}
        >
          <svg aria-hidden="true" focusable="false" width="32" height="32" viewBox="0 0 32 32">
            <g fill="none" fillRule="evenodd">
              <rect className="uppy-ProviderIconBg" width="32" height="32" rx="16" fill="#2275D7" />
              <path d="M21.973 21.152H9.863l-1.108-5.087h14.464l-1.246 5.087zM9.935 11.37h3.958l.886 1.444a.673.673 0 0 0 .585.316h6.506v1.37H9.935v-3.13zm14.898 3.44a.793.793 0 0 0-.616-.31h-.978v-2.126c0-.379-.275-.613-.653-.613H15.75l-.886-1.445a.673.673 0 0 0-.585-.316H9.232c-.378 0-.667.209-.667.587V14.5h-.782a.793.793 0 0 0-.61.303.795.795 0 0 0-.155.663l1.45 6.633c.078.36.396.618.764.618h13.354c.36 0 .674-.246.76-.595l1.631-6.636a.795.795 0 0 0-.144-.675z" fill="#FFF" />
            </g>
          </svg>
          <div className="uppy-DashboardTab-name">{this.props.i18n('myDevice')}</div>
        </button>
      </div>
    )
  }

  renderPhotoCamera = () => {
    return (
      <div
        className="uppy-DashboardTab"
        role="presentation"
        data-uppy-acquirer-id="MobilePhotoCamera"
      >
        <button
          type="button"
          className="uppy-u-reset uppy-c-btn uppy-DashboardTab-btn"
          role="tab"
          tabIndex={0}
          data-uppy-super-focusable
          onClick={this.triggerPhotoCameraInputClick}
        >
          <svg aria-hidden="true" focusable="false" width="32" height="32" viewBox="0 0 32 32">
            <g fill="none" fillRule="evenodd">
              <rect className="uppy-ProviderIconBg" fill="#03BFEF" width="32" height="32" rx="16" />
              <path d="M22 11c1.133 0 2 .867 2 2v7.333c0 1.134-.867 2-2 2H10c-1.133 0-2-.866-2-2V13c0-1.133.867-2 2-2h2.333l1.134-1.733C13.6 9.133 13.8 9 14 9h4c.2 0 .4.133.533.267L19.667 11H22zm-6 1.533a3.764 3.764 0 0 0-3.8 3.8c0 2.129 1.672 3.801 3.8 3.801s3.8-1.672 3.8-3.8c0-2.13-1.672-3.801-3.8-3.801zm0 6.261c-1.395 0-2.46-1.066-2.46-2.46 0-1.395 1.065-2.461 2.46-2.461s2.46 1.066 2.46 2.46c0 1.395-1.065 2.461-2.46 2.461z" fill="#FFF" fillRule="nonzero" />
            </g>
          </svg>
          <div className="uppy-DashboardTab-name">{this.props.i18n('takePictureBtn')}</div>
        </button>
      </div>
    )
  }

  renderVideoCamera = () => {
    return (
      <div
        className="uppy-DashboardTab"
        role="presentation"
        data-uppy-acquirer-id="MobileVideoCamera"
      >
        <button
          type="button"
          className="uppy-u-reset uppy-c-btn uppy-DashboardTab-btn"
          role="tab"
          tabIndex={0}
          data-uppy-super-focusable
          onClick={this.triggerVideoCameraInputClick}
        >
          <svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32">
            <rect fill="#1abc9c" width="32" height="32" rx="16" />
            <path fill="#FFF" fillRule="nonzero" d="m21.254 14.277 2.941-2.588c.797-.313 1.243.818 1.09 1.554-.01 2.094.02 4.189-.017 6.282-.126.915-1.145 1.08-1.58.34l-2.434-2.142c-.192.287-.504 1.305-.738.468-.104-1.293-.028-2.596-.05-3.894.047-.312.381.823.426 1.069.063-.384.206-.744.362-1.09zm-12.939-3.73c3.858.013 7.717-.025 11.574.02.912.129 1.492 1.237 1.351 2.217-.019 2.412.04 4.83-.03 7.239-.17 1.025-1.166 1.59-2.029 1.429-3.705-.012-7.41.025-11.114-.019-.913-.129-1.492-1.237-1.352-2.217.018-2.404-.036-4.813.029-7.214.136-.82.83-1.473 1.571-1.454z " />
          </svg>
          <div className="uppy-DashboardTab-name">{this.props.i18n('recordVideoBtn')}</div>
        </button>
      </div>
    )
  }

  renderBrowseButton = (text, onClickFn) => {
    const numberOfAcquirers = this.props.acquirers.length
    return (
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn uppy-Dashboard-browse"
        onClick={onClickFn}
        data-uppy-super-focusable={numberOfAcquirers === 0}
      >
        {text}
      </button>
    )
  }

  renderDropPasteBrowseTagline = () => {
    const numberOfAcquirers = this.props.acquirers.length
    const browseFiles = this.renderBrowseButton(this.props.i18n('browseFiles'), this.triggerFileInputClick)
    const browseFolders = this.renderBrowseButton(this.props.i18n('browseFolders'), this.triggerFolderInputClick)

    // in order to keep the i18n CamelCase and options lower (as are defaults) we will want to transform a lower
    // to Camel
    const lowerFMSelectionType = this.props.fileManagerSelectionType
    const camelFMSelectionType = lowerFMSelectionType.charAt(0).toUpperCase() + lowerFMSelectionType.slice(1)

    return (
      <div class="uppy-Dashboard-AddFiles-title">
        {
          // eslint-disable-next-line no-nested-ternary
          this.props.disableLocalFiles ? this.props.i18n('importFiles')
            : numberOfAcquirers > 0
              ? this.props.i18nArray(`dropPasteImport${camelFMSelectionType}`, { browseFiles, browseFolders, browse: browseFiles })
              : this.props.i18nArray(`dropPaste${camelFMSelectionType}`, { browseFiles, browseFolders, browse: browseFiles })
        }
      </div>
    )
  }

  [Symbol.for('uppy test: disable unused locale key warning')] () {
    // Those are actually used in `renderDropPasteBrowseTagline` method.
    this.props.i18nArray('dropPasteBoth')
    this.props.i18nArray('dropPasteFiles')
    this.props.i18nArray('dropPasteFolders')
    this.props.i18nArray('dropPasteImportBoth')
    this.props.i18nArray('dropPasteImportFiles')
    this.props.i18nArray('dropPasteImportFolders')
  }

  renderAcquirer = (acquirer) => {
    return (
      <div
        className="uppy-DashboardTab"
        role="presentation"
        data-uppy-acquirer-id={acquirer.id}
      >
        <button
          type="button"
          className="uppy-u-reset uppy-c-btn uppy-DashboardTab-btn"
          role="tab"
          tabIndex={0}
          data-cy={acquirer.id}
          aria-controls={`uppy-DashboardContent-panel--${acquirer.id}`}
          aria-selected={this.props.activePickerPanel.id === acquirer.id}
          data-uppy-super-focusable
          onClick={() => this.props.showPanel(acquirer.id)}
        >
          {acquirer.icon()}
          <div className="uppy-DashboardTab-name">{acquirer.name}</div>
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
      <Fragment>
        {acquirersWithoutLastTwo.map((acquirer) => this.renderAcquirer(acquirer))}
        <span role="presentation" style={{ 'white-space': 'nowrap' }}>
          {lastTwoAcquirers.map((acquirer) => this.renderAcquirer(acquirer))}
        </span>
      </Fragment>
    )
  }

  renderSourcesList = (acquirers, disableLocalFiles) => {
    const { showNativePhotoCameraButton, showNativeVideoCameraButton } = this.props

    return (
      <div className="uppy-Dashboard-AddFiles-list" role="tablist">
        {!disableLocalFiles && this.renderMyDeviceAcquirer()}
        {!disableLocalFiles && showNativePhotoCameraButton && this.renderPhotoCamera()}
        {!disableLocalFiles && showNativeVideoCameraButton && this.renderVideoCamera()}
        {acquirers.length > 0 && this.renderAcquirers(acquirers)}
      </div>
    )
  }

  renderPoweredByUppy () {
    const { i18nArray } = this.props

    const uppyBranding = (
      <span>
        <svg aria-hidden="true" focusable="false" className="uppy-c-icon uppy-Dashboard-poweredByIcon" width="11" height="11" viewBox="0 0 11 11">
          <path d="M7.365 10.5l-.01-4.045h2.612L5.5.806l-4.467 5.65h2.604l.01 4.044h3.718z" fillRule="evenodd" />
        </svg>
        <span className="uppy-Dashboard-poweredByUppy">Uppy</span>
      </span>
    )

    const linkText = i18nArray('poweredBy', { uppy: uppyBranding })

    return (
      <a
        tabIndex="-1"
        href="https://uppy.io"
        rel="noreferrer noopener"
        target="_blank"
        className="uppy-Dashboard-poweredBy"
      >
        {linkText}
      </a>
    )
  }

  render () {
    const {
      showNativePhotoCameraButton,
      showNativeVideoCameraButton,
      nativeCameraFacingMode,
    } = this.props

    return (
      <div className="uppy-Dashboard-AddFiles">
        {this.renderHiddenInput(false, (ref) => { this.fileInput = ref })}
        {this.renderHiddenInput(true, (ref) => { this.folderInput = ref })}
        {showNativePhotoCameraButton && this.renderHiddenCameraInput('photo', nativeCameraFacingMode, (ref) => { this.mobilePhotoFileInput = ref })}
        {showNativeVideoCameraButton && this.renderHiddenCameraInput('video', nativeCameraFacingMode, (ref) => { this.mobileVideoFileInput = ref })}
        {this.renderDropPasteBrowseTagline()}
        {this.renderSourcesList(this.props.acquirers, this.props.disableLocalFiles)}
        <div className="uppy-Dashboard-AddFiles-info">
          {this.props.note && <div className="uppy-Dashboard-note">{this.props.note}</div>}
          {this.props.proudlyDisplayPoweredByUppy && this.renderPoweredByUppy(this.props)}
        </div>
      </div>
    )
  }
}

export default AddFiles
