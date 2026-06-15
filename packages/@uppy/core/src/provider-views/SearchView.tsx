import type { ComponentChild } from 'preact'
import { useSearchForm } from './useSearchForm.js'

interface SearchViewProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  inputLabel: string
  loading?: boolean
  children: ComponentChild
}

/**
 * SearchView component for search with a submit button.
 * Typically used for initial search views or forms that require explicit submission.
 * The children prop is rendered as the button content, allowing full control over button text and loading states.
 */
function SearchView({
  value,
  onChange,
  onSubmit,
  inputLabel,
  loading = false,
  children,
}: SearchViewProps) {
  const { formId } = useSearchForm(onSubmit)

  return (
    <section className="uppy-SearchProvider">
      <input
        className="uppy-u-reset uppy-c-textInput uppy-SearchProvider-input"
        type="search"
        aria-label={inputLabel}
        placeholder={inputLabel}
        value={value}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        form={formId}
        disabled={loading}
        data-uppy-super-focusable
      />
      <button
        disabled={loading}
        className="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-SearchProvider-searchButton"
        type="submit"
        form={formId}
      >
        {children}
      </button>
    </section>
  )
}

export default SearchView
