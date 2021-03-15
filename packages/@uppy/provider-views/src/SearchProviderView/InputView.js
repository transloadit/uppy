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
    <div className="uppy-SearchProvider">
      <input
        className="uppy-u-reset uppy-c-textInput uppy-SearchProvider-input"
        type="text"
        aria-label={props.i18n('enterTextToSearch')}
        placeholder={props.i18n('enterTextToSearch')}
        onKeyUp={handleKeyPress}
        ref={(input_) => { input = input_ }}
        data-uppy-super-focusable
      />
      <button
        className="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-SearchProvider-searchButton"
        type="button"
        onClick={validateAndSearch}
      >
        {props.i18n('searchImages')}
      </button>
    </div>
  )
}
