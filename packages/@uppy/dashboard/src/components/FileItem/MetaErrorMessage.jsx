import { h } from 'preact'

const metaFieldIdToName = (metaFieldId, metaFields) => {
  const field = metaFields.filter(f => f.id === metaFieldId)
  return field[0].name
}

export default function renderMissingMetaFieldsError (props) {
  const { file, toggleFileCard, i18n, metaFields } = props
  const { missingRequiredMetaFields } = file
  if (!missingRequiredMetaFields?.length) {
    return null
  }

  const metaFieldsString = missingRequiredMetaFields.map(missingMetaField => (
    metaFieldIdToName(missingMetaField, metaFields)
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
