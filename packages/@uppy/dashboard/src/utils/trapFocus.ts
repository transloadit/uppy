// @ts-ignore untyped
import FOCUSABLE_ELEMENTS from '@uppy/utils/lib/FOCUSABLE_ELEMENTS'
import toArray from '@uppy/utils/lib/toArray'
import getActiveOverlayEl from './getActiveOverlayEl.js'

type $TSFixMe = any

function focusOnFirstNode(event: $TSFixMe, nodes: $TSFixMe) {
  const node = nodes[0]
  if (node) {
    node.focus()
    event.preventDefault()
  }
}

function focusOnLastNode(event: $TSFixMe, nodes: $TSFixMe) {
  const node = nodes[nodes.length - 1]
  if (node) {
    node.focus()
    event.preventDefault()
  }
}

// ___Why not just use (focusedItemIndex === -1)?
//    Firefox thinks <ul> is focusable, but we don't have <ul>s in our FOCUSABLE_ELEMENTS. Which means that if we tab into
//    the <ul>, code will think that we are not in the active overlay, and we should focusOnFirstNode() of the currently
//    active overlay!
//    [Practical check] if we use (focusedItemIndex === -1), instagram provider in firefox will never get focus on its pics
//    in the <ul>.
function isFocusInOverlay(activeOverlayEl: $TSFixMe) {
  return activeOverlayEl.contains(document.activeElement)
}

function trapFocus(
  event: $TSFixMe,
  activeOverlayType: $TSFixMe,
  dashboardEl: $TSFixMe,
): void {
  const activeOverlayEl = getActiveOverlayEl(dashboardEl, activeOverlayType)
  const focusableNodes = toArray(
    activeOverlayEl.querySelectorAll(FOCUSABLE_ELEMENTS),
  )

  const focusedItemIndex = focusableNodes.indexOf(document.activeElement)

  // If we pressed tab, and focus is not yet within the current overlay - focus on
  // the first element within the current overlay.
  // This is a safety measure (for when user returns from another tab e.g.), most
  // plugins will try to focus on some important element as it loads.
  if (!isFocusInOverlay(activeOverlayEl)) {
    focusOnFirstNode(event, focusableNodes)
    // If we pressed shift + tab, and we're on the first element of a modal
  } else if (event.shiftKey && focusedItemIndex === 0) {
    focusOnLastNode(event, focusableNodes)
    // If we pressed tab, and we're on the last element of the modal
  } else if (
    !event.shiftKey &&
    focusedItemIndex === focusableNodes.length - 1
  ) {
    focusOnFirstNode(event, focusableNodes)
  }
}

// Traps focus inside of the currently open overlay (e.g. Dashboard, or e.g. Instagram),
// never lets focus disappear from the modal.
export { trapFocus as forModal }

// Traps focus inside of the currently open overlay, unless overlay is null - then let the user tab away.
export function forInline(
  event: $TSFixMe,
  activeOverlayType: $TSFixMe,
  dashboardEl: $TSFixMe,
): void {
  // ___When we're in the bare 'Drop files here, paste, browse or import from' screen
  if (activeOverlayType === null) {
    // Do nothing and let the browser handle it, user can tab away from Uppy to other elements on the page
    // ___When there is some overlay with 'Done' button
  } else {
    // Trap the focus inside this overlay!
    // User can close the overlay (click 'Done') if they want to travel away from Uppy.
    trapFocus(event, activeOverlayType, dashboardEl)
  }
}
