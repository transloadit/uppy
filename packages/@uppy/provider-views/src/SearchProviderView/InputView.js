const { h } = require('preact')

module.exports = (props) => {
  let input
  const handleKeyPress = (ev) => {
    if (ev.keyCode === 13) {
      validateAndSearch()
    }
  }

  const validateAndSearch = () => {
    if (input.value) {
      props.search(input.value)
    }
  }

  return (
    <div class="uppy-SearchProvider">
      <input
        class="uppy-u-reset uppy-c-textInput uppy-SearchProvider-input"
        type="text"
        aria-label={props.i18n('enterTextToSearch')}
        placeholder={props.i18n('enterTextToSearch')}
        onkeyup={handleKeyPress}
        ref={(input_) => { input = input_ }}
        data-uppy-super-focusable
      />
      <button
        class="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-SearchProvider-searchButton"
        type="button"
        onclick={validateAndSearch}
      >
        {props.i18n('searchImages')}
      </button>
    </div>
  )
}
