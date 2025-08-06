import type Translator from '@uppy/utils/lib/Translator'
import type { I18n } from '@uppy/utils/lib/Translator'
import { Component, type ComponentChild, Fragment, h } from 'preact'
import type { TargetedEvent } from 'preact/compat'
import type { DashboardState, TargetWithRender } from '../Dashboard.js'

interface AddFilesProps {
  i18n: I18n
  i18nArray: Translator['translateArray']
  acquirers: TargetWithRender[]
  handleInputChange: (event: TargetedEvent<HTMLInputElement, Event>) => void
  maxNumberOfFiles: number | null
  allowedFileTypes: string[] | null
  showNativePhotoCameraButton: boolean
  showNativeVideoCameraButton: boolean
  nativeCameraFacingMode: 'user' | 'environment' | ''
  showPanel: (id: string) => void
  activePickerPanel: DashboardState<any, any>['activePickerPanel']
  disableLocalFiles: boolean
  fileManagerSelectionType: string
  note: string | null
  proudlyDisplayPoweredByUppy: boolean
}

class AddFiles extends Component<AddFilesProps> {
  fileInput: HTMLInputElement | null = null

  folderInput: HTMLInputElement | null = null

  mobilePhotoFileInput: HTMLInputElement | null = null

  mobileVideoFileInput: HTMLInputElement | null = null

  private triggerFileInputClick = () => {
    this.fileInput?.click()
  }

  private triggerFolderInputClick = () => {
    this.folderInput?.click()
  }

  private triggerVideoCameraInputClick = () => {
    this.mobileVideoFileInput?.click()
  }

  private triggerPhotoCameraInputClick = () => {
    this.mobilePhotoFileInput?.click()
  }

  private onFileInputChange = (
    event: TargetedEvent<HTMLInputElement, Event>,
  ) => {
    this.props.handleInputChange(event)

    // Clear the input so that Chrome/Safari/etc. can detect file section when the same file is repeatedly selected
    // (see https://github.com/transloadit/uppy/issues/768#issuecomment-2264902758)
    event.currentTarget.value = ''
  }

  private renderHiddenInput = (
    isFolder: boolean,
    refCallback: (ref: HTMLInputElement | null) => void,
  ) => {
    return (
      <input
        className="uppy-Dashboard-input"
        hidden
        aria-hidden="true"
        tabIndex={-1}
        // @ts-expect-error default types don't yet know about the `webkitdirectory` property
        webkitdirectory={isFolder}
        type="file"
        name="files[]"
        multiple={this.props.maxNumberOfFiles !== 1}
        onChange={this.onFileInputChange}
        accept={this.props.allowedFileTypes?.join(', ')}
        ref={refCallback}
      />
    )
  }

  private renderHiddenCameraInput = (
    type: 'photo' | 'video',
    nativeCameraFacingMode: 'user' | 'environment' | '',
    refCallback: (ref: HTMLInputElement | null) => void,
  ) => {
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
        capture={
          nativeCameraFacingMode === '' ? 'environment' : nativeCameraFacingMode
        }
        accept={accept}
        ref={refCallback}
      />
    )
  }

  private renderMyDeviceAcquirer = () => {
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
          <div className="uppy-DashboardTab-inner">
            <svg
              className="uppy-DashboardTab-iconMyDevice"
              aria-hidden="true"
              focusable="false"
              width="32"
              height="32"
              viewBox="0 0 32 32"
            >
              <path
                d="M8.45 22.087l-1.305-6.674h17.678l-1.572 6.674H8.45zm4.975-12.412l1.083 1.765a.823.823 0 00.715.386h7.951V13.5H8.587V9.675h4.838zM26.043 13.5h-1.195v-2.598c0-.463-.336-.75-.798-.75h-8.356l-1.082-1.766A.823.823 0 0013.897 8H7.728c-.462 0-.815.256-.815.718V13.5h-.956a.97.97 0 00-.746.37.972.972 0 00-.19.81l1.724 8.565c.095.44.484.755.933.755H24c.44 0 .824-.3.929-.727l2.043-8.568a.972.972 0 00-.176-.825.967.967 0 00-.753-.38z"
                fill="currentcolor"
                fill-rule="evenodd"
              />
            </svg>
          </div>
          <div className="uppy-DashboardTab-name">
            {this.props.i18n('myDevice')}
          </div>
        </button>
      </div>
    )
  }

  private renderPhotoCamera = () => {
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
          <div className="uppy-DashboardTab-inner">
            <svg
              aria-hidden="true"
              focusable="false"
              width="32"
              height="32"
              viewBox="0 0 32 32"
            >
              <path
                d="M23.5 9.5c1.417 0 2.5 1.083 2.5 2.5v9.167c0 1.416-1.083 2.5-2.5 2.5h-15c-1.417 0-2.5-1.084-2.5-2.5V12c0-1.417 1.083-2.5 2.5-2.5h2.917l1.416-2.167C13 7.167 13.25 7 13.5 7h5c.25 0 .5.167.667.333L20.583 9.5H23.5zM16 11.417a4.706 4.706 0 00-4.75 4.75 4.704 4.704 0 004.75 4.75 4.703 4.703 0 004.75-4.75c0-2.663-2.09-4.75-4.75-4.75zm0 7.825c-1.744 0-3.076-1.332-3.076-3.074 0-1.745 1.333-3.077 3.076-3.077 1.744 0 3.074 1.333 3.074 3.076s-1.33 3.075-3.074 3.075z"
                fill="#02B383"
                fill-rule="nonzero"
              />
            </svg>
          </div>
          <div className="uppy-DashboardTab-name">
            {this.props.i18n('takePictureBtn')}
          </div>
        </button>
      </div>
    )
  }

  private renderVideoCamera = () => {
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
          <div className="uppy-DashboardTab-inner">
            <svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32">
              <path
                fill="#FF675E"
                fillRule="nonzero"
                d="m21.254 14.277 2.941-2.588c.797-.313 1.243.818 1.09 1.554-.01 2.094.02 4.189-.017 6.282-.126.915-1.145 1.08-1.58.34l-2.434-2.142c-.192.287-.504 1.305-.738.468-.104-1.293-.028-2.596-.05-3.894.047-.312.381.823.426 1.069.063-.384.206-.744.362-1.09zm-12.939-3.73c3.858.013 7.717-.025 11.574.02.912.129 1.492 1.237 1.351 2.217-.019 2.412.04 4.83-.03 7.239-.17 1.025-1.166 1.59-2.029 1.429-3.705-.012-7.41.025-11.114-.019-.913-.129-1.492-1.237-1.352-2.217.018-2.404-.036-4.813.029-7.214.136-.82.83-1.473 1.571-1.454z "
              />
            </svg>
          </div>
          <div className="uppy-DashboardTab-name">
            {this.props.i18n('recordVideoBtn')}
          </div>
        </button>
      </div>
    )
  }

  private renderBrowseButton = (
    text: string,
    onClickFn: (event: Event) => void,
  ) => {
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

  private renderDropPasteBrowseTagline = (numberOfAcquirers: number) => {
    const browseFiles = this.renderBrowseButton(
      this.props.i18n('browseFiles'),
      this.triggerFileInputClick,
    )
    const browseFolders = this.renderBrowseButton(
      this.props.i18n('browseFolders'),
      this.triggerFolderInputClick,
    )

    // in order to keep the i18n CamelCase and options lower (as are defaults) we will want to transform a lower
    // to Camel
    const lowerFMSelectionType = this.props.fileManagerSelectionType
    const camelFMSelectionType =
      lowerFMSelectionType.charAt(0).toUpperCase() +
      lowerFMSelectionType.slice(1)

    return (
      <div class="uppy-Dashboard-AddFiles-title">
        {this.props.disableLocalFiles
          ? this.props.i18n('importFiles')
          : numberOfAcquirers > 0
            ? this.props.i18nArray(`dropPasteImport${camelFMSelectionType}`, {
                browseFiles,
                browseFolders,
                browse: browseFiles,
              })
            : this.props.i18nArray(`dropPaste${camelFMSelectionType}`, {
                browseFiles,
                browseFolders,
                browse: browseFiles,
              })}
      </div>
    )
  }

  private [Symbol.for('uppy test: disable unused locale key warning')]() {
    // Those are actually used in `renderDropPasteBrowseTagline` method.
    this.props.i18nArray('dropPasteBoth')
    this.props.i18nArray('dropPasteFiles')
    this.props.i18nArray('dropPasteFolders')
    this.props.i18nArray('dropPasteImportBoth')
    this.props.i18nArray('dropPasteImportFiles')
    this.props.i18nArray('dropPasteImportFolders')
  }

  private renderAcquirer = (acquirer: TargetWithRender) => {
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
          aria-selected={this.props.activePickerPanel?.id === acquirer.id}
          data-uppy-super-focusable
          onClick={() => this.props.showPanel(acquirer.id)}
        >
          <div className="uppy-DashboardTab-inner">{acquirer.icon()}</div>
          <div className="uppy-DashboardTab-name">{acquirer.name}</div>
        </button>
      </div>
    )
  }

  private renderAcquirers = (acquirers: TargetWithRender[]) => {
    // Group last two buttons, so we don’t end up with
    // just one button on a new line
    const acquirersWithoutLastTwo = [...acquirers]
    const lastTwoAcquirers = acquirersWithoutLastTwo.splice(
      acquirers.length - 2,
      acquirers.length,
    )

    return (
      <>
        {acquirersWithoutLastTwo.map((acquirer) =>
          this.renderAcquirer(acquirer),
        )}
        <span role="presentation" style={{ 'white-space': 'nowrap' }}>
          {lastTwoAcquirers.map((acquirer) => this.renderAcquirer(acquirer))}
        </span>
      </>
    )
  }

  private renderSourcesList = (
    acquirers: TargetWithRender[],
    disableLocalFiles: boolean,
  ) => {
    const { showNativePhotoCameraButton, showNativeVideoCameraButton } =
      this.props

    type RenderListItem = { key: string; elements: ComponentChild }
    let list: RenderListItem[] = []

    const myDeviceKey = 'myDevice'

    if (!disableLocalFiles)
      list.push({
        key: myDeviceKey,
        elements: this.renderMyDeviceAcquirer(),
      })
    if (showNativePhotoCameraButton)
      list.push({
        key: 'nativePhotoCameraButton',
        elements: this.renderPhotoCamera(),
      })
    if (showNativeVideoCameraButton)
      list.push({
        key: 'nativePhotoCameraButton',
        elements: this.renderVideoCamera(),
      })
    list.push(
      ...acquirers.map((acquirer: TargetWithRender) => ({
        key: acquirer.id,
        elements: this.renderAcquirer(acquirer),
      })),
    )

    // doesn't make sense to show only a lonely "My Device"
    const hasOnlyMyDevice = list.length === 1 && list[0].key === myDeviceKey
    if (hasOnlyMyDevice) list = []

    // Group last two buttons, so we don’t end up with
    // just one button on a new line
    const listWithoutLastTwo = [...list]
    const lastTwo = listWithoutLastTwo.splice(list.length - 2, list.length)

    return (
      <>
        {this.renderDropPasteBrowseTagline(list.length)}

        <div className="uppy-Dashboard-AddFiles-list" role="tablist">
          {listWithoutLastTwo.map(({ key, elements }) => (
            <Fragment key={key}>{elements}</Fragment>
          ))}

          <span role="presentation" style={{ 'white-space': 'nowrap' }}>
            {lastTwo.map(({ key, elements }) => (
              <Fragment key={key}>{elements}</Fragment>
            ))}
          </span>
        </div>
      </>
    )
  }

  private renderPoweredByUppy() {
    const { i18nArray } = this.props

    const uppyBranding = (
      <span>
        <svg
          aria-hidden="true"
          focusable="false"
          className="uppy-c-icon uppy-Dashboard-poweredByIcon"
          width="11"
          height="11"
          viewBox="0 0 11 11"
        >
          <path
            d="M7.365 10.5l-.01-4.045h2.612L5.5.806l-4.467 5.65h2.604l.01 4.044h3.718z"
            fillRule="evenodd"
          />
        </svg>
        <span className="uppy-Dashboard-poweredByUppy">Uppy</span>
      </span>
    )

    const linkText = i18nArray('poweredBy', { uppy: uppyBranding })

    return (
      <a
        tabIndex={-1}
        href="https://uppy.io"
        rel="noreferrer noopener"
        target="_blank"
        className="uppy-Dashboard-poweredBy"
      >
        {linkText}
      </a>
    )
  }

  render(): ComponentChild {
    const {
      showNativePhotoCameraButton,
      showNativeVideoCameraButton,
      nativeCameraFacingMode,
    } = this.props

    return (
      <div className="uppy-Dashboard-AddFiles">
        {this.renderHiddenInput(false, (ref) => {
          this.fileInput = ref
        })}
        {this.renderHiddenInput(true, (ref) => {
          this.folderInput = ref
        })}
        {showNativePhotoCameraButton &&
          this.renderHiddenCameraInput(
            'photo',
            nativeCameraFacingMode,
            (ref) => {
              this.mobilePhotoFileInput = ref
            },
          )}
        {showNativeVideoCameraButton &&
          this.renderHiddenCameraInput(
            'video',
            nativeCameraFacingMode,
            (ref) => {
              this.mobileVideoFileInput = ref
            },
          )}
        {this.renderSourcesList(
          this.props.acquirers,
          this.props.disableLocalFiles,
        )}
        <div className="uppy-Dashboard-AddFiles-info">
          {this.props.note && (
            <div className="uppy-Dashboard-note">{this.props.note}</div>
          )}
          {this.props.proudlyDisplayPoweredByUppy && this.renderPoweredByUppy()}
        </div>
      </div>
    )
  }
}

export default AddFiles
