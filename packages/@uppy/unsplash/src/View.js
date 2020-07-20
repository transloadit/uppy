const { h, Component } = require('preact')

class View extends Component {
  constructor (props) {
    super(props)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  componentDidMount () {
    this.input.value = ''
  }

  handleKeyPress (ev) {
    if (ev.keyCode === 13) {
      this.props.search(this.input.value)
    }
  }

  handleClick () {
    this.props.search(this.input.value)
  }

  gridItem (file) {
    return (
      <li class="uppy-SearchProviderItem">
        {/* <div aria-hidden class={`uppy-ProviderBrowserItem-fakeCheckbox ${this.props.isChecked ? 'uppy-ProviderBrowserItem-fakeCheckbox--is-checked' : ''}`} /> */}
        <button
          type="button"
          class="uppy-u-reset uppy-SearchProviderItem-inner"
          onclick={this.props.toggleCheckbox}

          role="option"
          aria-label={this.props.isChecked ? this.props.i18n('unselectFileNamed', { name: file.name }) : this.props.i18n('selectFileNamed', { name: file.name })}
          aria-selected={this.props.isChecked}
          aria-disabled={this.props.isDisabled}
          data-uppy-super-focusable
        >
          <img src={file.icon} />
        </button>
      </li>
    )
  }

  gridView () {
    return (
      <div class="uppy-SearchProvider-viewType--grid">
        <ul
          class="uppy-SearchProvider-list"
          onscroll={this.props.handleScroll}
          role="listbox"
          // making <ul> not focusable for firefox
          tabindex="-1"
        >
          {this.props.files.map(file => this.gridItem(file))}
        </ul>
      </div>
    )
  }

  emptyView () {
    return <div class="uppy-Provider-empty">{this.props.i18n('noFilesFound')}</div>
  }

  render () {
    if (!this.props.isInputMode && !this.props.files.length) {
      return this.emptyView()
    }

    if (!this.props.isInputMode) {
      return this.gridView()
    }

    return (
      <div class="uppy-SearchProvider">
        <input
          class="uppy-u-reset uppy-c-textInput uppy-SearchProvider-input"
          type="text"
          aria-label={this.props.i18n('enterTextToSearch')}
          placeholder={this.props.i18n('enterTextToSearch')}
          onkeyup={this.handleKeyPress}
          ref={(input) => { this.input = input }}
          data-uppy-super-focusable
        />
        <button
          class="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-SearchProvider-searchButton"
          type="button"
          onclick={this.handleClick}
        >
          {this.props.i18n('search')}
        </button>
      </div>
    )
  }
}

module.exports = View
