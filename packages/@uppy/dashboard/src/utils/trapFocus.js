const toArray = require('@uppy/utils/lib/toArray')

const FOCUSABLE_ELEMENTS = [
  'a[href]:not([tabindex^="-"]):not([inert]):not([aria-hidden])',
  'area[href]:not([tabindex^="-"]):not([inert]):not([aria-hidden])',
  'input:not([disabled]):not([inert]):not([aria-hidden])',
  'select:not([disabled]):not([inert]):not([aria-hidden])',
  'textarea:not([disabled]):not([inert]):not([aria-hidden])',
  'button:not([disabled]):not([inert]):not([aria-hidden])',
  'iframe:not([tabindex^="-"]):not([inert]):not([aria-hidden])',
  'object:not([tabindex^="-"]):not([inert]):not([aria-hidden])',
  'embed:not([tabindex^="-"]):not([inert]):not([aria-hidden])',
  '[contenteditable]:not([tabindex^="-"]):not([inert]):not([aria-hidden])',
  '[tabindex]:not([tabindex^="-"]):not([inert]):not([aria-hidden])'
]

function getFocusableNodes (activeOverlayType, dashboardEl) {
  let nodes = []

  // if an overlay is open, we should trap focus inside the overlay
  if (activeOverlayType) {
    const activeOverlay = dashboardEl.querySelector(`[data-uppy-paneltype="${activeOverlayType}"]`)
    // if an overlay already mounted
    if (activeOverlay) {
      nodes = toArray(activeOverlay.querySelectorAll(FOCUSABLE_ELEMENTS))
    }
  } else {
    nodes = toArray(dashboardEl.querySelectorAll(FOCUSABLE_ELEMENTS))
  }

  return nodes
}

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

// Traps focus inside of the currently open subview (e.g. Dashboard, or e.g. Instagram)
module.exports = function trapFocus (event, activeOverlayType, dashboardEl) {
  const focusableNodes = getFocusableNodes(activeOverlayType, dashboardEl)
  const focusedItemIndex = focusableNodes.indexOf(document.activeElement)

  // If we pressed tab, and focus is not yet within the current overlay - focus on the first element within the current overlay.
  // This is a safety measure, most plugins will try to focus on some important element as it loads.
  if (focusedItemIndex === -1) {
    focusOnFirstNode(event, focusableNodes)
  }
  // If we pressed shift + tab, and we're on the first element of a modal
  if (event.shiftKey && focusedItemIndex === 0) {
    focusOnLastNode(event, focusableNodes)
  }
  // If we pressed tab, and we're on the last element of the modal
  if (!event.shiftKey && focusedItemIndex === focusableNodes.length - 1) {
    focusOnFirstNode(event, focusableNodes)
  }
}
