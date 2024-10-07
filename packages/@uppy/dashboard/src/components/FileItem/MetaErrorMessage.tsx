import { h } from 'preact'

type $TSFixMe = any

const metaFieldIdToName = (metaFieldId: $TSFixMe, metaFields: $TSFixMe) => {
  const fields = typeof metaFields === 'function' ? metaFields() : metaFields
  const field = fields.filter((f: $TSFixMe) => f.id === metaFieldId)
  return field[0].name
}

export default function MetaErrorMessage(props: $TSFixMe) {
  const { file, toggleFileCard, i18n, metaFields } = props
  const { missingRequiredMetaFields } = file
  if (!missingRequiredMetaFields?.length) {
    return null as $TSFixMe
  }

  const metaFieldsString = missingRequiredMetaFields
    .map((missingMetaField: $TSFixMe) =>
      metaFieldIdToName(missingMetaField, metaFields),
    )
    .join(', ')

  return (
    <div className="uppy-Dashboard-Item-errorMessage">
      {i18n('missingRequiredMetaFields', {
        smart_count: missingRequiredMetaFields.length,
        fields: metaFieldsString,
      })}{' '}
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
