import { h } from 'preact'

const SUBMIT_KEY = 13

export default (props) => {
  const { searchTerm, i18n, search } = props

  const handleKeyPress = (ev) => {
    if (ev.keyCode === SUBMIT_KEY) {
      ev.stopPropagation()
      ev.preventDefault()
      search(ev.target.value)
    }
  }

  return (
    <div class="uppy-ProviderBrowser-search">
      <input
        class="uppy-u-reset uppy-ProviderBrowser-searchInput"
        type="text"
        placeholder={i18n('search')}
        aria-label={i18n('search')}
        value={searchTerm}
        onKeyUp={handleKeyPress}
        data-uppy-super-focusable
      />
      <svg aria-hidden="true" focusable="false" class="uppy-c-icon uppy-ProviderBrowser-searchIcon" width="12" height="12" viewBox="0 0 12 12">
        <path d="M8.638 7.99l3.172 3.172a.492.492 0 1 1-.697.697L7.91 8.656a4.977 4.977 0 0 1-2.983.983C2.206 9.639 0 7.481 0 4.819 0 2.158 2.206 0 4.927 0c2.721 0 4.927 2.158 4.927 4.82a4.74 4.74 0 0 1-1.216 3.17zm-3.71.685c2.176 0 3.94-1.726 3.94-3.856 0-2.129-1.764-3.855-3.94-3.855C2.75.964.984 2.69.984 4.819c0 2.13 1.765 3.856 3.942 3.856z" />
      </svg>
    </div>
  )
}
