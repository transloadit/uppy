const ActionBrowseTagline = require('./ActionBrowseTagline')
const { localIcon } = require('./icons')
const { h, Component } = require('preact')

const poweredByUppy = (props) => {
  return <a tabindex="-1" href="https://uppy.io" rel="noreferrer noopener" target="_blank" class="uppy-Dashboard-poweredBy">Powered by <svg aria-hidden="true" class="UppyIcon uppy-Dashboard-poweredByIcon" width="11" height="11" viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.365 10.5l-.01-4.045h2.612L5.5.806l-4.467 5.65h2.604l.01 4.044h3.718z" fill-rule="evenodd" />
  </svg><span class="uppy-Dashboard-poweredByUppy">Uppy</span></a>
}
class AddFiles extends Component {
  constructor (props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick (ev) {
    this.input.click()
  }

  render () {
    const hasAcquirers = this.props.acquirers.length !== 0

    if (!hasAcquirers) {
      return (
        <div class="uppy-DashboardAddFiles">
          <div class="uppy-DashboardTabs">
            <ActionBrowseTagline
              acquirers={this.props.acquirers}
              handleInputChange={this.props.handleInputChange}
              i18n={this.props.i18n}
              i18nArray={this.props.i18nArray}
              allowedFileTypes={this.props.allowedFileTypes}
              maxNumberOfFiles={this.props.maxNumberOfFiles}
            />
          </div>
          <div class="uppy-DashboardAddFiles-info">
            { this.props.note && <div class="uppy-Dashboard-note">{this.props.note}</div> }
            { this.props.proudlyDisplayPoweredByUppy && poweredByUppy(this.props) }
          </div>
        </div>
      )
    }

    // empty value="" on file input, so that the input is cleared after a file is selected,
    // because Uppy will be handling the upload and so we can select same file
    // after removing — otherwise browser thinks it’s already selected
    return (
      <div class="uppy-DashboardAddFiles">
        <div class="uppy-DashboardTabs">
          <ActionBrowseTagline
            acquirers={this.props.acquirers}
            handleInputChange={this.props.handleInputChange}
            i18n={this.props.i18n}
            i18nArray={this.props.i18nArray}
            allowedFileTypes={this.props.allowedFileTypes}
            maxNumberOfFiles={this.props.maxNumberOfFiles}
          />
          <div class="uppy-DashboardTabs-list" role="tablist">
            <div class="uppy-DashboardTab" role="presentation">
              <button type="button"
                class="uppy-DashboardTab-btn"
                role="tab"
                tabindex={0}
                onclick={this.handleClick}>
                {localIcon()}
                <div class="uppy-DashboardTab-name">{this.props.i18n('myDevice')}</div>
              </button>
              <input class="uppy-Dashboard-input"
                hidden
                aria-hidden="true"
                tabindex={-1}
                type="file"
                name="files[]"
                multiple={this.props.maxNumberOfFiles !== 1}
                accept={this.props.allowedFileTypes}
                onchange={this.props.handleInputChange}
                value=""
                ref={(input) => { this.input = input }} />
            </div>
            {this.props.acquirers.map((target) => {
              return <div class="uppy-DashboardTab" role="presentation">
                <button class="uppy-DashboardTab-btn"
                  type="button"
                  role="tab"
                  tabindex={0}
                  aria-controls={`uppy-DashboardContent-panel--${target.id}`}
                  aria-selected={this.props.activePickerPanel.id === target.id}
                  onclick={() => this.props.showPanel(target.id)}>
                  {target.icon()}
                  <div class="uppy-DashboardTab-name">{target.name}</div>
                </button>
              </div>
            })}
          </div>
        </div>
        <div class="uppy-DashboardAddFiles-info">
          { this.props.note && <div class="uppy-Dashboard-note">{this.props.note}</div> }
          { this.props.proudlyDisplayPoweredByUppy && poweredByUppy(this.props) }
        </div>
      </div>
    )
  }
}

module.exports = AddFiles
