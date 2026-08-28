import classNames from 'classnames'
import type { h } from 'preact'
import { useEffect, useId, useRef, useState } from 'preact/hooks'
import type { ProviderDialogState } from '../index.js'
import type { I18n } from '../utils/index.js'

type ProviderDialogProps = {
  dialog: ProviderDialogState
  i18n: I18n
  onConfirm: (value?: string) => void
  onCancel: () => void
}

/**
 * Inline replacement for `window.prompt` / `window.confirm`, rendered on top
 * of the provider browser. Driven by `ProviderView.prompt()` / `.confirm()`.
 */
export default function ProviderDialog({
  dialog,
  i18n,
  onConfirm,
  onCancel,
}: ProviderDialogProps): h.JSX.Element {
  const [value, setValue] = useState(
    dialog.kind === 'prompt' ? (dialog.defaultValue ?? '') : '',
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const isPrompt = dialog.kind === 'prompt'
  const danger = dialog.kind === 'confirm' && dialog.danger === true

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    } else {
      confirmRef.current?.focus()
    }
    return () => {
      previouslyFocused?.focus?.()
    }
  }, [])

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-dismiss, the dialog itself is keyboard operable
    <div
      className="uppy-ProviderDialog-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <form
        className="uppy-ProviderDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={(event) => {
          event.preventDefault()
          onConfirm(isPrompt ? value : undefined)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            // Keep the Dashboard from treating this as "close the modal".
            event.preventDefault()
            event.stopPropagation()
            onCancel()
          }
        }}
      >
        <h3 id={titleId} className="uppy-ProviderDialog-title">
          {dialog.title}
        </h3>
        {dialog.kind === 'prompt' ? (
          <label className="uppy-ProviderDialog-label">
            {dialog.label && (
              <span className="uppy-ProviderDialog-labelText">
                {dialog.label}
              </span>
            )}
            <input
              ref={inputRef}
              type="text"
              className="uppy-u-reset uppy-c-textInput uppy-ProviderDialog-input"
              value={value}
              onInput={(event) =>
                setValue((event.target as HTMLInputElement).value)
              }
            />
          </label>
        ) : (
          dialog.message && (
            <p className="uppy-ProviderDialog-message">{dialog.message}</p>
          )
        )}
        <div className="uppy-ProviderDialog-actions">
          <button
            type="button"
            className="uppy-u-reset uppy-c-btn uppy-c-btn-link"
            onClick={onCancel}
          >
            {i18n('cancel')}
          </button>
          <button
            ref={confirmRef}
            type="submit"
            className={classNames(
              'uppy-u-reset uppy-c-btn uppy-c-btn-primary',
              danger && 'uppy-ProviderDialog-confirm--danger',
            )}
          >
            {dialog.confirmLabel ?? i18n('dialogConfirm')}
          </button>
        </div>
      </form>
    </div>
  )
}
