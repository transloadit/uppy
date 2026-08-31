import type { h, RefObject } from 'preact'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'preact/hooks'
import type { PartialTreeFile, PartialTreeFolderNode } from '../../../index.js'
import type { I18n } from '../../../utils/index.js'
import type { ProviderAction } from '../../ProviderView/ProviderView.js'

type ItemActionsPopoverProps = {
  file: PartialTreeFile | PartialTreeFolderNode
  actions: ProviderAction<any, any>[]
  /** The "⋯" button the menu belongs to. */
  anchor: HTMLElement
  /** The scrolling list; scrolling it would leave the menu behind. */
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
 * The open actions menu for one item: a `popover="auto"` element in the top
 * layer, positioned from the trigger's viewport rect (flipping upwards near
 * the bottom), so no ancestor can clip it. Light-dismiss, Escape and focus
 * return are the browser's; arrow keys move between entries. Engines without
 * the Popover API get a plain positioned menu that closes on Escape/Tab/action.
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

  // Position from the trigger's live viewport rect. Measured only while the
  // menu is actually rendered (a closed `[popover]` is display:none and
  // reports height 0, which would break the flip), and re-measured whenever
  // the page scrolls or resizes so the menu never detaches from its trigger.
  const reposition = useCallback(() => {
    const menu = menuRef.current
    if (!menu) return
    const a = anchor.getBoundingClientRect()
    const height = menu.offsetHeight
    const fitsBelow = a.bottom + GAP + height <= window.innerHeight
    setPosition({
      top: fitsBelow ? a.bottom + GAP : Math.max(0, a.top - GAP - height),
      right: Math.max(0, window.innerWidth - a.right),
    })
  }, [anchor])

  useLayoutEffect(reposition, [reposition])

  useEffect(() => {
    const menu = menuRef.current
    const container = containerRef.current
    if (!menu) return
    // Mirror the browser's light-dismiss / Escape into our state.
    const onToggle = (event: Event) => {
      if ((event as Event & { newState?: string }).newState === 'closed')
        onClose()
    }
    menu.addEventListener('toggle', onToggle)
    if (typeof menu.showPopover === 'function') menu.showPopover()
    // Showing the popover gives it a real height: correct the estimate.
    reposition()
    const onPageScroll = (event: Event) => {
      // The scrolling list closes the menu; anything else (the host page)
      // moves the trigger, so the menu follows it.
      if (
        container &&
        event.target instanceof Node &&
        container.contains(event.target)
      ) {
        onClose()
        return
      }
      reposition()
    }
    window.addEventListener('scroll', onPageScroll, true)
    window.addEventListener('resize', reposition)
    // `preventScroll`: the Dashboard panel is an overflow:hidden container that
    // would otherwise be scrolled (mid slide-in animation) to reveal the item.
    menu
      .querySelector<HTMLElement>('[role="menuitem"]')
      ?.focus({ preventScroll: true })
    return () => {
      menu.removeEventListener('toggle', onToggle)
      window.removeEventListener('scroll', onPageScroll, true)
      window.removeEventListener('resize', reposition)
    }
  }, [containerRef, onClose, reposition])

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
        // The browser hides the popover; keep the Dashboard from treating the
        // same key press as "close the modal".
        event.stopPropagation()
        if (typeof menuRef.current?.hidePopover !== 'function')
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
      popover="auto"
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
