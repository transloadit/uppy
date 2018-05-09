const { h, Component } = require('preact')

class ActionBrowseTagline extends Component {
  constructor (props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick (ev) {
    this.input.click()
  }

  render () {
    // empty value=""  on file input, so we can select same file
    // after removing it from Uppy — otherwise OS thinks it’s selected

    return (
      <span>
        {this.props.acquirers.length === 0
          ? this.props.i18n('dropPaste')
          : this.props.i18n('dropPasteImport')
        } <button type="button" class="uppy-Dashboard-browse" onclick={this.handleClick}>
          {this.props.i18n('browse')}
        </button>
        <input class="uppy-Dashboard-input"
          hidden="true"
          aria-hidden="true"
          tabindex="-1"
          type="file"
          name="files[]"
          multiple={this.props.maxNumberOfFiles !== 1}
          onchange={this.props.handleInputChange}
          accept={this.props.allowedFileTypes}
          value=""
          ref={(input) => {
            this.input = input
          }} />
      </span>
    )
  }
}

module.exports = ActionBrowseTagline
