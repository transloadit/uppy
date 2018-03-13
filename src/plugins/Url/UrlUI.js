const { h, Component } = require('preact')

class UrlUI extends Component {
  constructor (props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  componentDidMount () {
    // My guess about why browser scrolls to top on focus:
    // Component is mounted right away, but the tab panel might be animating
    // still, so input element is positioned outside viewport. This fixes it.
    setTimeout(() => {
      this.input.focus({ preventScroll: true })
    }, 150)
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
        value=""
        ref={(input) => { this.input = input }} />
      <button
        class="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Url-importButton"
        type="button"
        aria-label={this.props.i18n('addUrl')}
        onclick={this.handleClick}>
        {this.props.i18n('import')}
      </button>
    </div>
  }
}

module.exports = UrlUI
