const { h, Component } = require('preact')
const getFileTypeIcon = require('../../utils/getFileTypeIcon')
const ignoreEvent = require('../../utils/ignoreEvent.js')
const FilePreview = require('../FilePreview')

class FileCard extends Component {
  constructor (props) {
    super(props)

    const file = this.props.files[this.props.fileCardFor]
    const metaFields = this.props.metaFields || []

    const storedMetaData = {}
    metaFields.forEach((field) => {
      storedMetaData[field.id] = file.meta[field.id] || ''
    })

    this.state = {
      formState: storedMetaData
    }
  }

  saveOnEnter = (ev) => {
    if (ev.keyCode === 13) {
      ev.stopPropagation()
      ev.preventDefault()
      const file = this.props.files[this.props.fileCardFor]
      this.props.saveFileCard(this.state.formState, file.id)
    }
  }

  tempStoreMeta = (ev, name, type) => {
    var value = ev.target.value
    if (type === 'checkbox') value = ev.target.checked ? 'on' : 'off'
    this.setState({
      formState: {
        ...this.state.formState,
        [name]: value
      }
    })
  }

  handleSave = () => {
    const fileID = this.props.fileCardFor
    this.props.saveFileCard(this.state.formState, fileID)
  }

  handleCancel = () => {
    this.props.toggleFileCard()
  }

  renderInputField = (type, id, field) => {
    if (type === 'checkbox') {
      return (
        <input
          class=""
          id={id}
          type="checkbox"
          onChange={ev => this.tempStoreMeta(ev, field.id, type)}
          defaultChecked={this.state.formState[field.id] === 'on'}
          data-uppy-super-focusable
        />
      )
    } else if (type === 'select') {
      return (
        <select
          id={id}
          onChange={ev => this.tempStoreMeta(ev, field.id, type)}
          class="uppy-Dashboard-FileCard-input uppy-c-textInput"
          value={this.state.formState[field.id]}
        >
          {field.options.map((opt) => {
            return (<option key={opt.value} value={opt.value}>{opt.text}</option>)
          })}
        </select>
      )
    } else {
      return (
        <input
          class="uppy-u-reset uppy-c-textInput uppy-Dashboard-FileCard-input"
          id={id}
          type={field.type || 'text'}
          value={this.state.formState[field.id]}
          placeholder={field.placeholder}
          onkeyup={this.saveOnEnter}
          onkeydown={this.saveOnEnter}
          onkeypress={this.saveOnEnter}
          oninput={ev => this.tempStoreMeta(ev, field.id, type)}
          data-uppy-super-focusable
        />)
    }
  }

  renderMetaFields = () => {
    const metaFields = this.props.metaFields || []
    return metaFields.map((field) => {
      const id = `uppy-Dashboard-FileCard-input-${field.id}`
      return (
        <fieldset key={field.id} class="uppy-Dashboard-FileCard-fieldset">
          <label class="uppy-Dashboard-FileCard-label" for={id}>{field.name}</label>
          {this.renderInputField(field.type || 'text', id, field)}
        </fieldset>
      )
    })
  }

  render () {
    const file = this.props.files[this.props.fileCardFor]

    return (
      <div
        class="uppy-Dashboard-FileCard"
        data-uppy-panelType="FileCard"
        onDragOver={ignoreEvent}
        onDragLeave={ignoreEvent}
        onDrop={ignoreEvent}
        onPaste={ignoreEvent}
      >
        <div class="uppy-DashboardContent-bar">
          <div class="uppy-DashboardContent-title" role="heading" aria-level="1">
            {this.props.i18nArray('editing', {
              file: <span class="uppy-DashboardContent-titleFile">{file.meta ? file.meta.name : file.name}</span>
            })}
          </div>
          <button
            class="uppy-DashboardContent-back" type="button" title={this.props.i18n('finishEditingFile')}
            onclick={this.handleSave}
          >
            {this.props.i18n('done')}
          </button>
        </div>

        <div class="uppy-Dashboard-FileCard-inner">
          <div class="uppy-Dashboard-FileCard-preview" style={{ backgroundColor: getFileTypeIcon(file.type).color }}>
            <FilePreview file={file} />
          </div>

          <div class="uppy-Dashboard-FileCard-info">
            {this.renderMetaFields()}
          </div>

          <div class="uppy-Dashboard-FileCard-actions">
            <button
              class="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Dashboard-FileCard-actionsBtn"
              type="button"
              onclick={this.handleSave}
            >
              {this.props.i18n('saveChanges')}
            </button>
            <button
              class="uppy-u-reset uppy-c-btn uppy-c-btn-link uppy-Dashboard-FileCard-actionsBtn"
              type="button"
              onclick={this.handleCancel}
            >
              {this.props.i18n('cancel')}
            </button>
          </div>
        </div>
      </div>
    )
  }
}

module.exports = FileCard
