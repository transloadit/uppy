import { h } from 'preact'
import { useEffect } from 'preact/hooks'
import { nanoid } from 'nanoid/non-secure'

export default ({ i18n, search }) => {
  let input
  const validateAndSearch = (ev) => {
    ev.preventDefault()
    if (input.value) {
      search(input.value)
    }
  }

  const form = document.createElement('form')
  form.id = nanoid()

  useEffect(() => {
    form.addEventListener('submit', validateAndSearch)
    document.body.appendChild(form)
    return () => {
      form.removeEventListener('submit', validateAndSearch)
      document.body.removeChild(form)
    }
  })

  return (
    <div className="uppy-SearchProvider">
      <input
        className="uppy-u-reset uppy-c-textInput uppy-SearchProvider-input"
        type="search"
        aria-label={i18n('enterTextToSearch')}
        placeholder={i18n('enterTextToSearch')}
        ref={(input_) => { input = input_ }}
        data-uppy-super-focusable
        form={form.id}
      />
      <button
        className="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-SearchProvider-searchButton"
        type="submit"
        form={form.id}
      >
        {i18n('searchImages')}
      </button>
    </div>
  )
}
