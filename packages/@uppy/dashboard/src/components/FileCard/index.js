const { h, Component } = require('preact')
const classNames = require('classnames')
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

  updateMeta = (newVal, name) => {
    this.setState({
      formState: {
        ...this.state.formState,
        [name]: newVal
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

  renderMetaFields = () => {
    const metaFields = this.props.metaFields || []
    const fieldCSSClasses = {
      text: 'uppy-u-reset uppy-c-textInput uppy-Dashboard-FileCard-input'
    }

    return metaFields.map((field) => {
      const id = `uppy-Dashboard-FileCard-input-${field.id}`
      return (
        <fieldset key={field.id} class="uppy-Dashboard-FileCard-fieldset">
          <label class="uppy-Dashboard-FileCard-label" for={id}>{field.name}</label>
          {field.render !== undefined
            ? field.render({
              value: this.state.formState[field.id],
              onChange: (newVal) => this.updateMeta(newVal, field.id),
              fieldCSSClasses: fieldCSSClasses
            }, h)
            : (
              <input
                class={fieldCSSClasses.text}
                id={id}
                type={field.type || 'text'}
                value={this.state.formState[field.id]}
                placeholder={field.placeholder}
                onkeyup={this.saveOnEnter}
                onkeydown={this.saveOnEnter}
                onkeypress={this.saveOnEnter}
                oninput={ev => this.updateMeta(ev.target.value, field.id)}
                data-uppy-super-focusable
              />
            )}
        </fieldset>
      )
    })
  }

  render () {
    const file = this.props.files[this.props.fileCardFor]
    const showEditButton = this.props.canEditFile(file)

    return (
      <div
        class={classNames('uppy-Dashboard-FileCard', this.props.className)}
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
            {showEditButton &&
              <button
                type="button"
                class="uppy-u-reset uppy-c-btn uppy-Dashboard-FileCard-edit"
                onClick={() => this.props.openFileEditor(file)}
              >
                {this.props.i18n('editFile')}
              </button>}
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
