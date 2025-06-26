import type { I18n } from '@uppy/utils/lib/Translator'
import { nanoid } from 'nanoid/non-secure'
import { Component, type ComponentChild, h } from 'preact'

type UrlUIProps = {
  i18n: I18n
  addFile: (url: string) => void
}

class UrlUI extends Component<UrlUIProps> {
  form = document.createElement('form')

  // Ref is always defined after render
  input!: HTMLInputElement

  constructor(props: UrlUIProps) {
    super(props)
    this.form.id = nanoid()
  }

  componentDidMount(): void {
    this.input.value = ''
    this.form.addEventListener('submit', this.#handleSubmit)
    document.body.appendChild(this.form)
  }

  componentWillUnmount(): void {
    this.form.removeEventListener('submit', this.#handleSubmit)
    document.body.removeChild(this.form)
  }

  #handleSubmit = (ev: SubmitEvent) => {
    ev.preventDefault()
    const { addFile } = this.props
    const preparedValue = this.input.value.trim()
    addFile(preparedValue)
  }

  render(): ComponentChild {
    const { i18n } = this.props
    return (
      <div className="uppy-Url">
        <input
          className="uppy-u-reset uppy-c-textInput uppy-Url-input"
          type="text"
          aria-label={i18n('enterUrlToImport')}
          placeholder={i18n('enterUrlToImport')}
          ref={(input) => {
            this.input = input!
          }}
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
