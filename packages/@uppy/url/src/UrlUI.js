const { h, Component } = require('preact')

class UrlUI extends Component {
  constructor (props) {
    super(props)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  componentDidMount () {
    this.input.value = ''
  }

  handleKeyPress (ev) {
    if (ev.keyCode === 13) {
      this.props.addFile(this.input.value)
    }
  }

  handleClick () {
    this.props.addFile(this.input.value)
  }

  render () {
    return (
      <div class="uppy-Url">
        <input
          class="uppy-u-reset uppy-c-textInput uppy-Url-input"
          type="text"
          aria-label={this.props.i18n('enterUrlToImport')}
          placeholder={this.props.i18n('enterUrlToImport')}
          onkeyup={this.handleKeyPress}
          ref={(input) => { this.input = input }}
          data-uppy-super-focusable
        />
        <button
          class="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Url-importButton"
          type="button"
          onclick={this.handleClick}
        >
          {this.props.i18n('import')}
        </button>
      </div>
    )
  }
}

module.exports = UrlUI
