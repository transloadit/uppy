import type { Body, I18n, Meta, UppyFile } from '@uppy/core/utils'
import type { ComponentChildren } from 'preact'
import type { DashboardState } from '../../Dashboard.js'

function metaFieldIdToName<M extends Meta, B extends Body>(
  metaFieldId: string,
  metaFields: DashboardState<M, B>['metaFields'],
) {
  const fields =
    typeof metaFields === 'function'
      ? // @ts-expect-error TODO This should not be an error.
        metaFields()
      : metaFields
  // @ts-expect-error TODO This should not be an error.
  const field = fields.filter((f) => f.id === metaFieldId)
  return field[0].name
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
    .map((missingMetaField) => metaFieldIdToName(missingMetaField, metaFields))
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
