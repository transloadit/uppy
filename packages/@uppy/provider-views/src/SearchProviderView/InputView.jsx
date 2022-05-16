import { h } from 'preact'

export default ({ i18n, search }) => {
  let input
  const validateAndSearch = () => {
    if (input.value) {
      search(input.value)
    }
  }
  const handleKeyPress = (ev) => {
    if (ev.keyCode === 13) {
      validateAndSearch()
    }
  }

  return (
    <div className="uppy-SearchProvider">
      <input
        className="uppy-u-reset uppy-c-textInput uppy-SearchProvider-input"
        type="search"
        aria-label={i18n('enterTextToSearch')}
        placeholder={i18n('enterTextToSearch')}
        onKeyUp={handleKeyPress}
        ref={(input_) => { input = input_ }}
        data-uppy-super-focusable
      />
      <button
        className="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-SearchProvider-searchButton"
        type="button"
        onClick={validateAndSearch}
      >
        {i18n('searchImages')}
      </button>
    </div>
  )
}
