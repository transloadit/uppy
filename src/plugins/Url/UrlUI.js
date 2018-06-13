const { h, Component } = require('preact')

class UrlUI extends Component {
  constructor (props) {
    super(props)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  componentDidMount () {
    this.input.value = ''
    // My guess about why browser scrolls to top on focus:
    // Component is mounted right away, but the tab panel might be animating
    // still, so input element is positioned outside viewport. This fixes it.
    setTimeout(() => {
      if (!this.input) return
      this.input.focus({ preventScroll: true })
    }, 150)
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
    return <div class="uppy-Url">
      <input
        class="uppy-c-textInput uppy-Url-input"
        type="text"
        placeholder={this.props.i18n('enterUrlToImport')}
        onkeyup={this.handleKeyPress}
        ref={(input) => { this.input = input }} />
      <button
        class="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Url-importButton"
        type="button"
        aria-label={this.props.i18n('import')}
        onclick={this.handleClick}>
        {this.props.i18n('import')}
      </button>
    </div>
  }
}

module.exports = UrlUI
