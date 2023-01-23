import { h, Component } from 'preact'
import { nanoid } from 'nanoid/non-secure'

class UrlUI extends Component {
  form = document.createElement('form')

  constructor (props) {
    super(props)
    this.form.id = nanoid()
  }

  componentDidMount () {
    this.input.value = ''
    this.form.addEventListener('submit', this.#handleSubmit)
    document.body.appendChild(this.form)
  }

  componentWillUnmount () {
    this.form.removeEventListener('submit', this.#handleSubmit)
    document.body.removeChild(this.form)
  }

  #handleSubmit = (ev) => {
    ev.preventDefault()
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
          ref={(input) => { this.input = input }}
          data-uppy-super-focusable
          form={this.form.id}
        />
        <button
          className="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Url-importButton"
          type="submit"
          form={this.form.id}
        >
          {i18n('import')}
        </button>
      </div>
    )
  }
}

export default UrlUI
