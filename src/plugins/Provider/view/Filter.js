const { h, Component } = require('preact')

module.exports = class Filter extends Component {
  constructor (props) {
    super(props)

    this.handleKeyPress = this.handleKeyPress.bind(this)
  }

  componentDidMount () {
    this.input.focus()
  }

  handleKeyPress (ev) {
    if (ev.keyCode === 13) {
      ev.stopPropagation()
      ev.preventDefault()
      return
    }
    this.props.filterQuery(ev)
  }

  render () {
    return <div style={{ display: 'flex', width: '100%' }}>
      <input
        class="uppy-ProviderBrowser-searchInput"
        type="text"
        placeholder="Search"
        onkeyup={this.handleKeyPress}
        onkeydown={this.handleKeyPress}
        onkeypress={this.handleKeyPress}
        value={this.props.filterInput}
        ref={(input) => { this.input = input }} />
      <button
        class="uppy-ProviderBrowser-searchClose"
        type="button"
        onclick={this.props.toggleSearch}>
        <svg class="UppyIcon" viewBox="0 0 19 19">
          <path d="M17.318 17.232L9.94 9.854 9.586 9.5l-.354.354-7.378 7.378h.707l-.62-.62v.706L9.318 9.94l.354-.354-.354-.354L1.94 1.854v.707l.62-.62h-.706l7.378 7.378.354.354.354-.354 7.378-7.378h-.707l.622.62v-.706L9.854 9.232l-.354.354.354.354 7.378 7.378.708-.707-7.38-7.378v.708l7.38-7.38.353-.353-.353-.353-.622-.622-.353-.353-.354.352-7.378 7.38h.708L2.56 1.23 2.208.88l-.353.353-.622.62-.353.355.352.353 7.38 7.38v-.708l-7.38 7.38-.353.353.352.353.622.622.353.353.354-.353 7.38-7.38h-.708l7.38 7.38z" />
        </svg>
      </button>
    </div>
  }
}
