const { h } = require('preact')

module.exports = function renderMissingMetaFieldsError (props) {
  const { file, toggleFileCard, i18n } = props
  const { missingRequiredMetaFields } = file
  if (!missingRequiredMetaFields) {
    return null
  }
  const metaFieldsString = missingRequiredMetaFields.map(field => (
    field.charAt(0).toUpperCase() + field.slice(1)
  )).join(', ')

  return (
    <div className="uppy-Dashboard-Item-errorMessage">
      {i18n('missingRequiredMetaFields', {
        smart_count: missingRequiredMetaFields.length,
        fields: metaFieldsString,
      })}
      {' '}
      <button
        type="button"
        class="uppy-u-reset uppy-Dashboard-Item-errorMessageBtn"
        onClick={() => toggleFileCard(true, file.id)}
      >
        {i18n('editFile')}
      </button>
    </div>
  )
}
