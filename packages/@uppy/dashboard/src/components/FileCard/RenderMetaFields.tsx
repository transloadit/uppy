import { h } from 'preact'

type $TSFixMe = any

export default function RenderMetaFields(props: $TSFixMe) {
  const {
    computedMetaFields,
    requiredMetaFields,
    updateMeta,
    form,
    formState,
  } = props

  const fieldCSSClasses = {
    text: 'uppy-u-reset uppy-c-textInput uppy-Dashboard-FileCard-input',
  }

  return computedMetaFields.map((field: $TSFixMe) => {
    const id = `uppy-Dashboard-FileCard-input-${field.id}`
    const required = requiredMetaFields.includes(field.id)
    return (
      <fieldset key={field.id} className="uppy-Dashboard-FileCard-fieldset">
        <label className="uppy-Dashboard-FileCard-label" htmlFor={id}>
          {field.name}
        </label>
        {field.render !== undefined ? (
          field.render(
            {
              value: formState[field.id],
              onChange: (newVal: $TSFixMe) => updateMeta(newVal, field.id),
              fieldCSSClasses,
              required,
              form: form.id,
            },
            h,
          )
        ) : (
          <input
            className={fieldCSSClasses.text}
            id={id}
            form={form.id}
            type={field.type || 'text'}
            required={required}
            value={formState[field.id]}
            placeholder={field.placeholder}
            onInput={(ev) =>
              updateMeta((ev.target as HTMLInputElement).value, field.id)
            }
            data-uppy-super-focusable
          />
        )}
      </fieldset>
    )
  })
}
