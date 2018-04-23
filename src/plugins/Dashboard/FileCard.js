const getFileTypeIcon = require('./getFileTypeIcon')
const FilePreview = require('./FilePreview')
const { h, Component } = require('preact')

module.exports = class FileCard extends Component {
  constructor (props) {
    super(props)

    this.meta = {}

    this.tempStoreMetaOrSubmit = this.tempStoreMetaOrSubmit.bind(this)
    this.renderMetaFields = this.renderMetaFields.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.handleCancel = this.handleCancel.bind(this)
  }

  tempStoreMetaOrSubmit (ev) {
    const file = this.props.files[this.props.fileCardFor]

    if (ev.keyCode === 13) {
      ev.stopPropagation()
      ev.preventDefault()
      this.props.saveFileCard(this.meta, file.id)
      return
    }

    const value = ev.target.value
    const name = ev.target.dataset.name
    this.meta[name] = value
  }

  renderMetaFields (file) {
    const metaFields = this.props.metaFields || []
    return metaFields.map((field) => {
      return <fieldset class="uppy-DashboardFileCard-fieldset">
        <label class="uppy-DashboardFileCard-label">{field.name}</label>
        <input class="uppy-c-textInput uppy-DashboardFileCard-input"
          type="text"
          data-name={field.id}
          value={file.meta[field.id]}
          placeholder={field.placeholder}
          onkeyup={this.tempStoreMetaOrSubmit}
          onkeydown={this.tempStoreMetaOrSubmit}
          onkeypress={this.tempStoreMetaOrSubmit} /></fieldset>
    })
  }

  handleSave (ev) {
    const fileID = this.props.fileCardFor
    this.props.saveFileCard(this.meta, fileID)
  }

  handleCancel (ev) {
    this.meta = {}
    this.props.toggleFileCard()
  }

  render () {
    const file = this.props.files[this.props.fileCardFor]

    return <div class="uppy-DashboardFileCard" aria-hidden={!this.props.fileCardFor}>
      {this.props.fileCardFor &&
        <div style={{ width: '100%', height: '100%' }}>
          <div class="uppy-DashboardContent-bar">
            <h2 class="uppy-DashboardContent-title">{this.props.i18n('editing')} <span class="uppy-DashboardContent-titleFile">{file.meta ? file.meta.name : file.name}</span></h2>
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
                title={this.props.i18n('finishEditingFiles')}
                onclick={this.handleSave}>Save changes</button>
              <button class="uppy-u-reset uppy-c-btn uppy-c-btn-link uppy-Dashboard-actionsBtn"
                type="button"
                title={this.props.i18n('finishEditingFiles')}
                onclick={this.handleCancel}>Cancel</button>
            </div>
          </div>
        </div>
      }
    </div>
  }
}
