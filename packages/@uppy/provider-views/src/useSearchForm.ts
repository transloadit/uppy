import { nanoid } from 'nanoid/non-secure'
import { useCallback, useEffect, useState } from 'preact/hooks'

/**
 * Hook to create a form element outside the component tree to avoid nested forms.
 * Returns a formId that can be used with the `form` attribute on inputs and buttons.
 *
 * This allows form submission (Enter key) to work properly even when the component
 * is rendered inside another form element.
 *
 * @param onSubmit - Callback to execute when the form is submitted
 * @returns Object containing the formId to use with form attribute
 */
export function useSearchForm(onSubmit: () => void): { formId: string } {
  const submit = useCallback(
    (ev: Event) => {
      ev.preventDefault()
      onSubmit()
    },
    [onSubmit],
  )

  // We create a form element and append it to document.body to avoid nested <form>s
  // (See https://github.com/transloadit/uppy/pull/5050#discussion_r1640392516)
  const [form] = useState(() => {
    const formEl = document.createElement('form')
    formEl.setAttribute('tabindex', '-1')
    formEl.id = nanoid()
    return formEl
  })

  useEffect(() => {
    document.body.appendChild(form)
    form.addEventListener('submit', submit)
    return () => {
      form.removeEventListener('submit', submit)
      document.body.removeChild(form)
    }
  }, [form, submit])

  return { formId: form.id }
}
