import { useCallback, useEffect, useState } from 'preact/hooks'
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
  const [open, setOpen] = useState<OpenItemMenu | null>(null)
  const openItem = open ? items.find((item) => item.id === open.id) : undefined

  useEffect(() => {
    if (open && !openItem) setOpen(null)
  }, [open, openItem])

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
