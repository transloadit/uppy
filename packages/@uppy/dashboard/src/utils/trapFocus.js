const toArray = require('@uppy/utils/lib/toArray')
const getActiveOverlayEl = require('./getActiveOverlayEl')
const FOCUSABLE_ELEMENTS = require('@uppy/utils/lib//FOCUSABLE_ELEMENTS')

function focusOnFirstNode (event, nodes) {
  const node = nodes[0]
  if (node) {
    node.focus()
    event.preventDefault()
  }
}

function focusOnLastNode (event, nodes) {
  const node = nodes[nodes.length - 1]
  if (node) {
    node.focus()
    event.preventDefault()
  }
}

// ___Why not just use (focusedItemIndex === -1)?
//    Firefox thinks <ul> is focusable, but we don't have <ul>s in our FOCUSABLE_ELEMENTS. Which means that if we tab into the <ul>, code will think that we are not in the active overlay, and we should focusOnFirstNode() of the currently active overlay!
//    [Practical check] if we use (focusedItemIndex === -1), instagram provider in firefox will never get focus on its pics in the <ul>.
function isFocusInOverlay (activeOverlayEl) {
  return activeOverlayEl.contains(document.activeElement)
}

// Traps focus inside of the currently open overlay (e.g. Dashboard, or e.g. Instagram)
module.exports = function trapFocus (event, activeOverlayType, dashboardEl) {
  const activeOverlayEl = getActiveOverlayEl(dashboardEl, activeOverlayType)
  const focusableNodes = toArray(activeOverlayEl.querySelectorAll(FOCUSABLE_ELEMENTS))

  const focusedItemIndex = focusableNodes.indexOf(document.activeElement)

  // If we pressed tab, and focus is not yet within the current overlay - focus on the first element within the current overlay.
  // This is a safety measure (for when user returns from another tab e.g.), most plugins will try to focus on some important element as it loads.
  if (!isFocusInOverlay(activeOverlayEl)) {
    focusOnFirstNode(event, focusableNodes)
  // If we pressed shift + tab, and we're on the first element of a modal
  } else if (event.shiftKey && focusedItemIndex === 0) {
    focusOnLastNode(event, focusableNodes)
  // If we pressed tab, and we're on the last element of the modal
  } else if (!event.shiftKey && focusedItemIndex === focusableNodes.length - 1) {
    focusOnFirstNode(event, focusableNodes)
  }
}
