import type { RefObject } from 'preact'
import { useEffect } from 'preact/hooks'

/**
 * Shows a `<dialog>` with `showModal()` once it is mounted: focus trap, Escape
 * (the `cancel` event), `::backdrop` and focus restore come from the browser.
 * Engines without `showModal` get the same dialog inline, without the trap.
 * The dialog is closed before it unmounts, as removing an open modal from the
 * DOM would skip the focus restore.
 */
export function useModalDialog(ref: RefObject<HTMLDialogElement>): void {
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
    return () => {
      if (dialog.open && typeof dialog.close === 'function') dialog.close()
    }
  }, [ref])
}

/**
 * `onKeyDown` for a dialog or menu the browser closes on Escape: keeps the
 * Dashboard from treating the same key press as "close the modal".
 */
export function stopEscapePropagation(event: KeyboardEvent): void {
  if (event.key === 'Escape') event.stopPropagation()
}
