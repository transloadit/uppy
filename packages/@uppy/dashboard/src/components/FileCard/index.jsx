import {  h, Component  } from 'preact'
import classNames from 'classnames'
import {  nanoid  } from 'nanoid/non-secure'
import getFileTypeIcon from '../../utils/getFileTypeIcon.jsx'
import ignoreEvent from '../../utils/ignoreEvent.js'
import FilePreview from '../FilePreview.jsx'

class FileCard extends Component {
  form = document.createElement('form')

  constructor (props) {
    super(props)

    const file = this.props.files[this.props.fileCardFor]
    const metaFields = this.getMetaFields() || []

    const storedMetaData = {}
    metaFields.forEach((field) => {
      storedMetaData[field.id] = file.meta[field.id] || ''
    })

    this.state = {
      formState: storedMetaData,
    }

    this.form.id = nanoid()
  }

  // TODO(aduh95): move this to `UNSAFE_componentWillMount` when updating to Preact X+.
  componentWillMount () { // eslint-disable-line react/no-deprecated
    this.form.addEventListener('submit', this.handleSave)
    document.body.appendChild(this.form)
  }

  componentWillUnmount () {
    this.form.removeEventListener('submit', this.handleSave)
    document.body.removeChild(this.form)
  }

  getMetaFields () {
    return typeof this.props.metaFields === 'function'
      ? this.props.metaFields(this.props.files[this.props.fileCardFor])
      : this.props.metaFields
  }

  updateMeta = (newVal, name) => {
    this.setState(({ formState }) => ({
      formState: {
        ...formState,
        [name]: newVal,
      },
    }))
  }

  handleSave = (e) => {
    e.preventDefault()
    const fileID = this.props.fileCardFor
    this.props.saveFileCard(this.state.formState, fileID)
  }

  handleCancel = () => {
    const file = this.props.files[this.props.fileCardFor]
    this.props.uppy.emit('file-editor:cancel', file)
    this.props.toggleFileCard(false)
  }

  saveOnEnter = (ev) => {
    if (ev.keyCode === 13) {
      ev.stopPropagation()
      ev.preventDefault()
      const file = this.props.files[this.props.fileCardFor]
      this.props.saveFileCard(this.state.formState, file.id)
    }
  }

  renderMetaFields = () => {
    const metaFields = this.getMetaFields() || []
    const fieldCSSClasses = {
      text: 'uppy-u-reset uppy-c-textInput uppy-Dashboard-FileCard-input',
    }

    return metaFields.map((field) => {
      const id = `uppy-Dashboard-FileCard-input-${field.id}`
      const required = this.props.requiredMetaFields.includes(field.id)
      return (
        <fieldset key={field.id} className="uppy-Dashboard-FileCard-fieldset">
          <label className="uppy-Dashboard-FileCard-label" htmlFor={id}>{field.name}</label>
          {field.render !== undefined
            ? field.render({
              value: this.state.formState[field.id],
              onChange: (newVal) => this.updateMeta(newVal, field.id),
              fieldCSSClasses,
              required,
              form: this.form.id,
            }, h)
            : (
              <input
                className={fieldCSSClasses.text}
                id={id}
                form={this.form.id}
                type={field.type || 'text'}
                required={required}
                value={this.state.formState[field.id]}
                placeholder={field.placeholder}
                // If `form` attribute is not supported, we need to capture pressing Enter to avoid bubbling in case Uppy is
                // embedded inside a <form>.
                onKeyUp={'form' in HTMLInputElement.prototype ? undefined : this.saveOnEnter}
                onKeyDown={'form' in HTMLInputElement.prototype ? undefined : this.saveOnEnter}
                onKeyPress={'form' in HTMLInputElement.prototype ? undefined : this.saveOnEnter}
                onInput={ev => this.updateMeta(ev.target.value, field.id)}
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
        className={classNames('uppy-Dashboard-FileCard', this.props.className)}
        data-uppy-panelType="FileCard"
        onDragOver={ignoreEvent}
        onDragLeave={ignoreEvent}
        onDrop={ignoreEvent}
        onPaste={ignoreEvent}
      >
        <div className="uppy-DashboardContent-bar">
          <div className="uppy-DashboardContent-title" role="heading" aria-level="1">
            {this.props.i18nArray('editing', {
              file: <span className="uppy-DashboardContent-titleFile">{file.meta ? file.meta.name : file.name}</span>,
            })}
          </div>
          <button
            className="uppy-DashboardContent-back"
            type="button"
            form={this.form.id}
            title={this.props.i18n('finishEditingFile')}
            onClick={this.handleCancel}
          >
            {this.props.i18n('cancel')}
          </button>
        </div>

        <div className="uppy-Dashboard-FileCard-inner">
          <div className="uppy-Dashboard-FileCard-preview" style={{ backgroundColor: getFileTypeIcon(file.type).color }}>
            <FilePreview file={file} />
            {showEditButton
              && (
              <button
                type="button"
                className="uppy-u-reset uppy-c-btn uppy-Dashboard-FileCard-edit"
                onClick={(event) => {
                  // When opening the image editor we want to save any meta fields changes.
                  // Otherwise it's confusing for the user to click save in the editor,
                  // but the changes here are discarded. This bypasses validation,
                  // but we are okay with that.
                  this.handleSave(event)
                  this.props.openFileEditor(file)
                }}
                form={this.form.id}
              >
                {this.props.i18n('editFile')}
              </button>
              )}
          </div>

          <div className="uppy-Dashboard-FileCard-info">
            {this.renderMetaFields()}
          </div>

          <div className="uppy-Dashboard-FileCard-actions">
            <button
              className="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Dashboard-FileCard-actionsBtn"
              // If `form` attribute is supported, we want a submit button to trigger the form validation.
              // Otherwise, fallback to a classic button with a onClick event handler.
              type={'form' in HTMLButtonElement.prototype ? 'submit' : 'button'}
              onClick={'form' in HTMLButtonElement.prototype ? undefined : this.handleSave}
              form={this.form.id}
            >
              {this.props.i18n('saveChanges')}
            </button>
            <button
              className="uppy-u-reset uppy-c-btn uppy-c-btn-link uppy-Dashboard-FileCard-actionsBtn"
              type="button"
              onClick={this.handleCancel}
              form={this.form.id}
            >
              {this.props.i18n('cancel')}
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default FileCard
