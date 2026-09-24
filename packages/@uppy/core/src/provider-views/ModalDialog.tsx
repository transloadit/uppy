import type { ComponentChildren, h } from 'preact'
import { useEffect, useRef } from 'preact/hooks'

type ModalDialogProps = Omit<
  h.JSX.HTMLAttributes<HTMLDialogElement>,
  'ref' | 'onCancel' | 'onClick' | 'onKeyDown' | 'onPointerDown'
> & {
  /** Escape, or a click on the backdrop. */
  onDismiss: () => void
  children: ComponentChildren
}

/**
 * `onKeyDown` for a dialog or menu the browser closes on Escape: keeps the
 * Dashboard from treating the same key press as "close the modal".
 */
export function stopEscapePropagation(event: KeyboardEvent): void {
  if (event.key === 'Escape') event.stopPropagation()
}

const isOnBackdrop = (event: MouseEvent): boolean => {
  const dialog = event.currentTarget as HTMLDialogElement
  if (event.target !== dialog) return false
  const rect = dialog.getBoundingClientRect()
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
}

/**
 * A native modal `<dialog>`, shown with `showModal()` once mounted: focus
 * trap, `::backdrop` and focus restore come from the browser (engines without
 * `showModal` get the same dialog inline, without the trap). Escape, a
 * click on the backdrop and the browser's other close requests (the `cancel`
 * event) call `onDismiss`; the dialog stays open until its
 * owner unmounts it, and is closed first, as removing an open modal from the
 * DOM would skip the focus restore.
 */
export default function ModalDialog({
  onDismiss,
  children,
  ...attributes
}: ModalDialogProps): h.JSX.Element {
  const ref = useRef<HTMLDialogElement>(null)
  // Only a click that also started on the backdrop dismisses: selecting text
  // in the dialog and releasing outside it is not one.
  const pressedBackdrop = useRef(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else {
      // No focus trap without showModal(): focus the dialog's first button
      // ourselves so Escape reaches it and not the page behind it.
      dialog.setAttribute('open', '')
      dialog.querySelector<HTMLButtonElement>('button')?.focus()
    }
    return () => {
      if (dialog.open && typeof dialog.close === 'function') dialog.close()
    }
  }, [])

  return (
    <dialog
      {...attributes}
      ref={ref}
      onCancel={(event) => {
        event.preventDefault()
        onDismiss()
      }}
      onPointerDown={(event) => {
        pressedBackdrop.current = isOnBackdrop(event)
      }}
      onClick={(event) => {
        if (pressedBackdrop.current && isOnBackdrop(event)) onDismiss()
        pressedBackdrop.current = false
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return
        // Handled here rather than through the `cancel` event, which only a
        // modal dialog fires; and the Dashboard must not treat the same key
        // press as "close the modal".
        event.preventDefault()
        event.stopPropagation()
        onDismiss()
      }}
    >
      {children}
    </dialog>
  )
}
