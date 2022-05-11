import { h, Component } from 'preact'

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
    const { addFile } = this.props
    if (ev.keyCode === 13) {
      addFile(this.input.value)
    }
  }

  handleClick () {
    const { addFile } = this.props
    addFile(this.input.value)
  }

  render () {
    const { i18n } = this.props
    return (
      <div className="uppy-Url">
        <input
          className="uppy-u-reset uppy-c-textInput uppy-Url-input"
          type="text"
          aria-label={i18n('enterUrlToImport')}
          placeholder={i18n('enterUrlToImport')}
          onKeyUp={this.handleKeyPress}
          ref={(input) => { this.input = input }}
          data-uppy-super-focusable
        />
        <button
          className="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Url-importButton"
          type="button"
          onClick={this.handleClick}
        >
          {i18n('import')}
        </button>
      </div>
    )
  }
}

export default UrlUI
