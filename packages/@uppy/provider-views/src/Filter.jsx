import { h, Component } from 'preact'

export default class Filter extends Component {
  constructor (props) {
    super(props)
    this.preventEnterPress = this.preventEnterPress.bind(this)
  }

  // eslint-disable-next-line class-methods-use-this
  preventEnterPress (ev) {
    if (ev.keyCode === 13) {
      ev.stopPropagation()
      ev.preventDefault()
    }
  }

  render () {
    const { i18n, filterInput, filterQuery } = this.props
    return (
      <div className="uppy-ProviderBrowser-filter">
        <input
          className="uppy-u-reset uppy-ProviderBrowser-filterInput"
          type="text"
          placeholder={i18n('filter')}
          aria-label={i18n('filter')}
          onKeyUp={this.preventEnterPress}
          onKeyDown={this.preventEnterPress}
          onKeyPress={this.preventEnterPress}
          onInput={(e) => filterQuery(e)}
          value={filterInput}
        />
        <svg aria-hidden="true" focusable="false" className="uppy-c-icon uppy-ProviderBrowser-filterIcon" width="12" height="12" viewBox="0 0 12 12">
          <path d="M8.638 7.99l3.172 3.172a.492.492 0 1 1-.697.697L7.91 8.656a4.977 4.977 0 0 1-2.983.983C2.206 9.639 0 7.481 0 4.819 0 2.158 2.206 0 4.927 0c2.721 0 4.927 2.158 4.927 4.82a4.74 4.74 0 0 1-1.216 3.17zm-3.71.685c2.176 0 3.94-1.726 3.94-3.856 0-2.129-1.764-3.855-3.94-3.855C2.75.964.984 2.69.984 4.819c0 2.13 1.765 3.856 3.942 3.856z" />
        </svg>
        {filterInput && (
          <button
            className="uppy-u-reset uppy-ProviderBrowser-filterClose"
            type="button"
            aria-label={i18n('resetFilter')}
            title={i18n('resetFilter')}
            onClick={filterQuery}
          >
            <svg aria-hidden="true" focusable="false" className="uppy-c-icon" viewBox="0 0 19 19">
              <path d="M17.318 17.232L9.94 9.854 9.586 9.5l-.354.354-7.378 7.378h.707l-.62-.62v.706L9.318 9.94l.354-.354-.354-.354L1.94 1.854v.707l.62-.62h-.706l7.378 7.378.354.354.354-.354 7.378-7.378h-.707l.622.62v-.706L9.854 9.232l-.354.354.354.354 7.378 7.378.708-.707-7.38-7.378v.708l7.38-7.38.353-.353-.353-.353-.622-.622-.353-.353-.354.352-7.378 7.38h.708L2.56 1.23 2.208.88l-.353.353-.622.62-.353.355.352.353 7.38 7.38v-.708l-7.38 7.38-.353.353.352.353.622.622.353.353.354-.353 7.38-7.38h-.708l7.38 7.38z" />
            </svg>
          </button>
        )}
      </div>
    )
  }
}
