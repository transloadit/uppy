import classNames from 'classnames'
import type { h } from 'preact'
import { useEffect, useId, useRef, useState } from 'preact/hooks'
import type { ProviderDialogState } from '../index.js'
import type { I18n } from '../utils/index.js'
import ModalDialog from './ModalDialog.js'

type ProviderDialogProps = {
  dialog: ProviderDialogState
  i18n: I18n
  onConfirm: (value?: string) => void
  onCancel: () => void
}

/**
 * Inline replacement for `window.prompt` / `window.confirm`, driven by
 * `ProviderView.prompt()` / `.confirm()`, as a {@link ModalDialog}.
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
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const isPrompt = dialog.kind === 'prompt'
  const danger = dialog.kind === 'confirm' && dialog.danger === true

  useEffect(() => {
    // A destructive confirm starts on Cancel: a stray Enter must not delete.
    ;(inputRef.current ?? (danger ? cancelRef : confirmRef).current)?.focus()
    inputRef.current?.select()
  }, [danger])

  return (
    <ModalDialog
      className="uppy-ProviderDialog"
      aria-labelledby={titleId}
      onDismiss={onCancel}
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
            ref={cancelRef}
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
    </ModalDialog>
  )
}
