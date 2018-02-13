const { h, Component } = require('preact')

class UrlUI extends Component {
  constructor (props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  componentDidMount () {
    this.input.focus()
  }

  handleClick () {
    this.props.addFile(this.input.value)
  }

  render () {
    return <div class="uppy-Url">
      <input
        class="uppy-Url-input"
        type="text"
        placeholder={this.props.i18n('enterUrlToImport')}
        ref={(input) => { this.input = input }} />
      <button
        class="uppy-Url-importButton"
        type="button"
        aria-label={this.props.i18n('addUrl')}
        onclick={this.handleClick}>
        {this.props.i18n('import')}
      </button>
    </div>
  }
}

module.exports = UrlUI
