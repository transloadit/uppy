import type { Body, I18n, Meta, UppyFile } from '@uppy/core/utils'
import type { ComponentChildren } from 'preact'
import type { DashboardState } from '../../Dashboard.js'

function metaFieldIdToName<M extends Meta, B extends Body>(
  metaFieldId: string,
  metaFields: DashboardState<M, B>['metaFields'],
  file: UppyFile<M, B>,
): string {
  const fields =
    typeof metaFields === 'function' ? metaFields(file) : metaFields
  const field = fields?.find((f) => f.id === metaFieldId)
  // `requiredMetaFields` is a core restriction, so a field can be required
  // without having a matching entry in the Dashboard `metaFields` option.
  return field?.name ?? metaFieldId
}

type MetaErrorMessageProps<M extends Meta, B extends Body> = {
  i18n: I18n
  file: UppyFile<M, B>
  metaFields: DashboardState<M, B>['metaFields']
  toggleFileCard: (show: boolean, fileId: string) => void
}

export default function MetaErrorMessage<M extends Meta, B extends Body>(
  props: MetaErrorMessageProps<M, B>,
): ComponentChildren {
  const { file, toggleFileCard, i18n, metaFields } = props
  const { missingRequiredMetaFields } = file
  if (!missingRequiredMetaFields?.length) {
    return null
  }

  const metaFieldsString = missingRequiredMetaFields
    .map((missingMetaField) =>
      metaFieldIdToName(missingMetaField, metaFields, file),
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
