import { useCallback, useState } from 'preact/hooks'
import type { PartialTreeFile, PartialTreeFolderNode } from '../../../index.js'

export type OpenItemMenu = { id: string; anchor: HTMLElement }

/**
 * The single open item-actions menu of a Browser: which item it belongs to
 * and the button that opened it. Closes itself when that item disappears
 * (deleted, folder refreshed).
 */
export default function useItemMenu(
  items: (PartialTreeFile | PartialTreeFolderNode)[],
) {
  const [opened, setOpen] = useState<OpenItemMenu | null>(null)
  const openItem = opened
    ? items.find((item) => item.id === opened.id)
    : undefined
  // Derived, not synced in an effect: a menu whose item disappeared (deleted,
  // folder refreshed) is simply closed.
  const open = opened && openItem ? opened : null

  const close = useCallback(() => setOpen(null), [])
  const toggle = useCallback(
    (id: string, anchor: HTMLElement) =>
      setOpen((current) => (current?.id === id ? null : { id, anchor })),
    [],
  )

  return {
    open,
    openItem,
    close,
    toggle,
    isOpen: (id: string) => open?.id === id,
  }
}
