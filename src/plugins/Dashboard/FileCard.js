const getFileTypeIcon = require('./getFileTypeIcon')
const { checkIcon } = require('./icons')
const { h, Component } = require('preact')

module.exports = class FileCard extends Component {
  constructor (props) {
    super(props)

    this.meta = {}

    this.tempStoreMetaOrSubmit = this.tempStoreMetaOrSubmit.bind(this)
    this.renderMetaFields = this.renderMetaFields.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  tempStoreMetaOrSubmit (ev) {
    const file = this.props.files[this.props.fileCardFor]

    if (ev.keyCode === 13) {
      ev.stopPropagation()
      ev.preventDefault()
      this.props.fileCardDone(this.meta, file.id)
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
        <input class="uppy-DashboardFileCard-input"
          type="text"
          data-name={field.id}
          value={file.meta[field.id]}
          placeholder={field.placeholder}
          onkeyup={this.tempStoreMetaOrSubmit}
          onkeydown={this.tempStoreMetaOrSubmit}
          onkeypress={this.tempStoreMetaOrSubmit} /></fieldset>
    })
  }

  handleClick (ev) {
    const file = this.props.files[this.props.fileCardFor]
    this.props.fileCardDone(this.meta, file.id)
  }

  render () {
    const file = this.props.files[this.props.fileCardFor]

    return <div class="uppy-DashboardFileCard" aria-hidden={!this.props.fileCardFor}>
      {this.props.fileCardFor &&
        <div style="width: 100%; height: 100%;">
          <div class="uppy-DashboardContent-bar">
            <h2 class="uppy-DashboardContent-title">Editing <span class="uppy-DashboardContent-titleFile">{file.meta ? file.meta.name : file.name}</span></h2>
            <button class="uppy-DashboardContent-back" type="button" title="Finish editing file"
              onclick={this.handleClick}>Done</button>
          </div>
          <div class="uppy-DashboardFileCard-inner">
            <div class="uppy-DashboardFileCard-preview" style={{ backgroundColor: getFileTypeIcon(file.type).color }}>
              {file.preview
                ? <img alt={file.name} src={file.preview} />
                : <div class="uppy-DashboardItem-previewIconWrap">
                  <span class="uppy-DashboardItem-previewIcon" style={{ color: getFileTypeIcon(file.type).color }}>{getFileTypeIcon(file.type).icon}</span>
                  <svg class="uppy-DashboardItem-previewIconBg" width="72" height="93" viewBox="0 0 72 93"><g><path d="M24.08 5h38.922A2.997 2.997 0 0 1 66 8.003v74.994A2.997 2.997 0 0 1 63.004 86H8.996A2.998 2.998 0 0 1 6 83.01V22.234L24.08 5z" fill="#FFF" /><path d="M24 5L6 22.248h15.007A2.995 2.995 0 0 0 24 19.244V5z" fill="#E4E4E4" /></g></svg>
                </div>
              }
            </div>
            <div class="uppy-DashboardFileCard-info">
              <fieldset class="uppy-DashboardFileCard-fieldset">
                <label class="uppy-DashboardFileCard-label">Name</label>
                <input class="uppy-DashboardFileCard-input"
                  type="text"
                  data-name="name"
                  value={file.meta.name || ''}
                  placeholder="name"
                  onkeyup={this.tempStoreMetaOrSubmit}
                  onkeydown={this.tempStoreMetaOrSubmit}
                  onkeypress={this.tempStoreMetaOrSubmit} />
              </fieldset>
              {this.renderMetaFields(file)}
            </div>
          </div>
          <div class="uppy-Dashboard-actions">
            <button class="UppyButton--circular UppyButton--blue uppy-DashboardFileCard-done"
              type="button"
              title="Finish editing file"
              onclick={this.handleClick}>{checkIcon()}</button>
          </div>
        </div>
      }
    </div>
  }
}
