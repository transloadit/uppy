import { h, Component } from 'preact'

class UrlUI extends Component {
  componentDidMount () {
    this.input.value = ''
  }

  #handleKeyPress = (ev) => {
    if (ev.keyCode === 13) {
      ev.preventDefault()
      this.#handleSubmit()
    }
  }

  #handleSubmit = () => {
    const { addFile } = this.props
    const preparedValue = this.input.value.trim()
    addFile(preparedValue)
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
          onKeyDown={this.#handleKeyPress}
          ref={(input) => { this.input = input }}
          data-uppy-super-focusable
        />
        <button
          className="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Url-importButton"
          type="button"
          onClick={this.#handleSubmit}
        >
          {i18n('import')}
        </button>
      </div>
    )
  }
}

export default UrlUI
