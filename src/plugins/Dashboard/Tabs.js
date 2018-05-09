const ActionBrowseTagline = require('./ActionBrowseTagline')
const { localIcon } = require('./icons')
const { h, Component } = require('preact')

class Tabs extends Component {
  constructor (props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick (ev) {
    this.input.click()
  }

  render () {
    const isHidden = Object.keys(this.props.files).length === 0
    const hasAcquirers = this.props.acquirers.length !== 0

    if (!hasAcquirers) {
      return (
        <div class="uppy-DashboardTabs" aria-hidden={isHidden}>
          <div class="uppy-DashboardTabs-title">
            <ActionBrowseTagline
              acquirers={this.props.acquirers}
              handleInputChange={this.props.handleInputChange}
              i18n={this.props.i18n} />
          </div>
        </div>
      )
    }

    // empty value="" on file input, so that the input is cleared after a file is selected,
    // because Uppy will be handling the upload and so we can select same file
    // after removing — otherwise browser thinks it’s already selected
    return <div class="uppy-DashboardTabs">
      <ul class="uppy-DashboardTabs-list" role="tablist">
        <li class="uppy-DashboardTab" role="presentation">
          <button type="button"
            class="uppy-DashboardTab-btn"
            role="tab"
            tabindex="0"
            onclick={this.handleClick}>
            {localIcon()}
            <div class="uppy-DashboardTab-name">{this.props.i18n('myDevice')}</div>
          </button>
          <input class="uppy-Dashboard-input"
            hidden="true"
            aria-hidden="true"
            tabindex="-1"
            type="file"
            name="files[]"
            multiple={this.props.maxNumberOfFiles !== 1}
            accept={this.props.allowedFileTypes}
            onchange={this.props.handleInputChange}
            value=""
            ref={(input) => { this.input = input }} />
        </li>
        {this.props.acquirers.map((target) => {
          return <li class="uppy-DashboardTab" role="presentation">
            <button class="uppy-DashboardTab-btn"
              type="button"
              role="tab"
              tabindex="0"
              aria-controls={`uppy-DashboardContent-panel--${target.id}`}
              aria-selected={this.props.activePanel.id === target.id}
              onclick={() => this.props.showPanel(target.id)}>
              {target.icon()}
              <h5 class="uppy-DashboardTab-name">{target.name}</h5>
            </button>
          </li>
        })}
      </ul>
    </div>
  }
}

module.exports = Tabs
