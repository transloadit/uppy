const getFileTypeIcon = require('../utils/getFileTypeIcon')
const FilePreview = require('./FilePreview')
const ignoreEvent = require('../utils/ignoreEvent.js')
const { h, Component } = require('preact')

class FileCard extends Component {
  constructor (props) {
    super(props)

    this.state = {}

    this.tempStoreMeta = this.tempStoreMeta.bind(this)
    this.saveOnEnter = this.saveOnEnter.bind(this)
    this.renderMetaFields = this.renderMetaFields.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.handleCancel = this.handleCancel.bind(this)
  }

  componentDidMount () {
    const file = this.props.files[this.props.fileCardFor]
    const metaFields = this.props.metaFields || []

    const storedMetaData = {}
    metaFields.forEach((field) => {
      storedMetaData[field.id] = file.meta[field.id]
    })
    this.setState(storedMetaData)
  }

  saveOnEnter (ev) {
    if (ev.keyCode === 13) {
      const file = this.props.files[this.props.fileCardFor]
      ev.stopPropagation()
      ev.preventDefault()
      this.props.saveFileCard(this.state, file.id)
    }
  }

  tempStoreMeta (ev) {
    const value = ev.target.value
    const name = ev.target.dataset.name
    this.setState({
      [name]: value
    })
  }

  handleSave (ev) {
    const fileID = this.props.fileCardFor
    this.props.saveFileCard(this.state, fileID)
  }

  handleCancel (ev) {
    this.setState({})
    this.props.toggleFileCard()
  }

  renderMetaFields (file) {
    const metaFields = this.props.metaFields || []

    return metaFields.map((field, i) => {
      return <fieldset class="uppy-DashboardFileCard-fieldset">
        <label class="uppy-DashboardFileCard-label">{field.name}</label>
        <input class="uppy-u-reset uppy-c-textInput uppy-DashboardFileCard-input"
          type="text"
          data-name={field.id}
          value={this.state[field.id]}
          placeholder={field.placeholder}
          onkeyup={this.saveOnEnter}
          onkeydown={this.saveOnEnter}
          onkeypress={this.saveOnEnter}
          oninput={this.tempStoreMeta}
          data-uppy-super-focusable />
      </fieldset>
    })
  }

  render () {
    const file = this.props.files[this.props.fileCardFor]

    return (
      <div class="uppy-DashboardFileCard"
        data-uppy-panelType="FileCard"
        onDragOver={ignoreEvent}
        onDragLeave={ignoreEvent}
        onDrop={ignoreEvent}
        onPaste={ignoreEvent}>
        <div class="uppy-DashboardContent-bar">
          <div class="uppy-DashboardContent-title" role="heading" aria-level="h1">
            {this.props.i18nArray('editing', {
              file: <span class="uppy-DashboardContent-titleFile">{file.meta ? file.meta.name : file.name}</span>
            })}
          </div>
          <button class="uppy-DashboardContent-back" type="button" title={this.props.i18n('finishEditingFile')}
            onclick={this.handleSave}>{this.props.i18n('done')}</button>
        </div>

        <div class="uppy-DashboardFileCard-inner">
          <div class="uppy-DashboardFileCard-preview" style={{ backgroundColor: getFileTypeIcon(file.type).color }}>
            <FilePreview file={file} />
          </div>

          <div class="uppy-DashboardFileCard-info">
            {this.renderMetaFields(file)}
          </div>

          <div class="uppy-Dashboard-actions">
            <button class="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Dashboard-actionsBtn"
              type="button"
              onclick={this.handleSave}>{this.props.i18n('saveChanges')}</button>
            <button class="uppy-u-reset uppy-c-btn uppy-c-btn-link uppy-Dashboard-actionsBtn"
              type="button"
              onclick={this.handleCancel}>{this.props.i18n('cancel')}</button>
          </div>
        </div>
      </div>
    )
  }
}

module.exports = FileCard
