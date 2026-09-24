import { useCallback, useState } from 'preact/hooks'
import type { PartialTreeFile, PartialTreeFolderNode } from '../../../index.js'

/**
 * The single open item-actions menu of a Browser: which item it belongs to
 * and the button that opened it.
 */
export default function useItemMenu(
  items: (PartialTreeFile | PartialTreeFolderNode)[],
) {
  const [opened, setOpened] = useState<{
    id: string
    anchor: HTMLElement
  } | null>(null)
  // Derived, not synced in an effect: a menu whose item disappeared (deleted,
  // folder refreshed) is simply closed.
  const item = opened ? items.find(({ id }) => id === opened.id) : undefined
  const open = opened && item ? { item, anchor: opened.anchor } : null

  const close = useCallback(() => setOpened(null), [])
  const toggle = useCallback(
    (id: string, anchor: HTMLElement) =>
      setOpened((current) => (current?.id === id ? null : { id, anchor })),
    [],
  )

  return { open, close, toggle }
}
