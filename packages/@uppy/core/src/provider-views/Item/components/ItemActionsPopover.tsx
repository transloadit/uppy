import type { h, RefObject } from 'preact'
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import type { PartialTreeFile, PartialTreeFolderNode } from '../../../index.js'
import type { I18n } from '../../../utils/index.js'
import type { ProviderAction } from '../../ProviderView/ProviderView.js'

type ItemActionsPopoverProps = {
  file: PartialTreeFile | PartialTreeFolderNode
  actions: ProviderAction<any, any>[]
  /** The "⋯" button the menu belongs to. */
  anchor: HTMLElement
  /** The `position: relative` element the menu is positioned in. */
  containerRef: RefObject<HTMLElement>
  runAction: (
    action: ProviderAction<any, any>,
    file: PartialTreeFile | PartialTreeFolderNode,
  ) => void
  onClose: () => void
  i18n: I18n
}

const GAP = 4

/**
 * The open actions menu for one item. Rendered by `Browser` next to the
 * scrolling list rather than inside the item, positioned from the trigger's
 * bounding rect (flipping upwards near the bottom), so the list's overflow
 * cannot clip it. Closes on Escape, outside click, scroll, resize and after
 * running an action; arrow keys move between entries.
 */
export default function ItemActionsPopover({
  file,
  actions,
  anchor,
  containerRef,
  runAction,
  onClose,
  i18n,
}: ItemActionsPopoverProps): h.JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{
    top: number
    right: number
  } | null>(null)

  useLayoutEffect(() => {
    const menu = menuRef.current
    const container = containerRef.current
    if (!menu || !container) return
    const a = anchor.getBoundingClientRect()
    const c = container.getBoundingClientRect()
    const height = menu.offsetHeight
    const fitsBelow = a.bottom + GAP + height <= c.bottom
    const fitsAbove = a.top - GAP - height >= c.top
    const top =
      fitsBelow || !fitsAbove
        ? a.bottom - c.top + GAP
        : a.top - c.top - GAP - height
    setPosition({
      top: Math.max(0, top),
      right: Math.max(0, c.right - a.right),
    })
  }, [anchor, containerRef])

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (menuRef.current?.contains(target) || anchor.contains(target)) return
      onClose()
    }
    // Our position goes stale when the list inside the container scrolls or
    // the panel resizes. (Scrolling of ancestors moves the container and the
    // menu together, so only scrolls *inside* the container matter.)
    const container = containerRef.current
    document.addEventListener('mousedown', onMouseDown)
    container?.addEventListener('scroll', onClose, true)
    window.addEventListener('resize', onClose)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      container?.removeEventListener('scroll', onClose, true)
      window.removeEventListener('resize', onClose)
    }
  }, [anchor, containerRef, onClose])

  useEffect(() => {
    // Move focus into the menu so it is keyboard operable straight away.
    // `preventScroll`: the Dashboard panel is an overflow:hidden container that
    // would otherwise be scrolled (mid slide-in animation) to reveal the item.
    menuRef.current
      ?.querySelector<HTMLElement>('[role="menuitem"]')
      ?.focus({ preventScroll: true })
  }, [])

  const closeAndRefocus = () => {
    onClose()
    anchor.focus({ preventScroll: true })
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    )
    const index = items.indexOf(document.activeElement as HTMLElement)
    const focusAt = (i: number) => {
      event.preventDefault()
      items[(i + items.length) % items.length]?.focus({ preventScroll: true })
    }
    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        // Keep the Dashboard from treating this as "close the modal".
        event.stopPropagation()
        closeAndRefocus()
        break
      case 'ArrowDown':
        focusAt(index + 1)
        break
      case 'ArrowUp':
        focusAt(index - 1)
        break
      case 'Home':
        focusAt(0)
        break
      case 'End':
        focusAt(items.length - 1)
        break
      case 'Tab':
        onClose()
        break
      default:
    }
  }

  return (
    <div
      ref={menuRef}
      className="uppy-ProviderBrowserItem-actionsMenu"
      role="menu"
      aria-label={i18n('itemActionsNamed', {
        name: file.data.name ?? i18n('unnamed'),
      })}
      style={
        position
          ? { top: `${position.top}px`, right: `${position.right}px` }
          : { visibility: 'hidden' }
      }
      onKeyDown={onKeyDown}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          role="menuitem"
          className="uppy-u-reset uppy-c-btn uppy-ProviderBrowserItem-actionsMenuItem"
          onClick={(event) => {
            event.stopPropagation()
            event.preventDefault()
            closeAndRefocus()
            runAction(action, file)
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
