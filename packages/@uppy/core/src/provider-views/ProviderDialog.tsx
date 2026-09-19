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
 * Inline replacement for `window.prompt` / `window.confirm`, driven by
 * `ProviderView.prompt()` / `.confirm()`. A native `<dialog>` opened with
 * `showModal()`: focus trap, Escape (the `cancel` event), `::backdrop` and
 * focus restore come from the browser. Engines without `showModal` get the
 * same dialog inline, without the trap.
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
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const isPrompt = dialog.kind === 'prompt'
  const danger = dialog.kind === 'confirm' && dialog.danger === true

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (typeof el.showModal === 'function') el.showModal()
    else el.setAttribute('open', '')
    ;(inputRef.current ?? confirmRef.current)?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="uppy-ProviderDialog"
      aria-labelledby={titleId}
      onCancel={onCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
      onKeyDown={(event) => {
        // The browser closes the dialog on Escape; only keep the Dashboard from
        // treating the same key press as "close the modal".
        if (event.key === 'Escape') event.stopPropagation()
      }}
    >
      <form
        className="uppy-ProviderDialog-form"
        onSubmit={(event) => {
          event.preventDefault()
          onConfirm(isPrompt ? value : undefined)
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
    </dialog>
  )
}
