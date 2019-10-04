const debounce = require('lodash.debounce')
const FOCUSABLE_ELEMENTS = require('@uppy/utils/lib/FOCUSABLE_ELEMENTS')
const getActiveOverlayEl = require('./getActiveOverlayEl')

/*
  Focuses on some element in the currently topmost overlay.

  1. If there are some [data-uppy-super-focusable] elements rendered already - focuses on the first superfocusable element, and leaves focus up to the control of a user (until currently focused element disappears from the screen [which can happen when overlay changes, or, e.g., when we click on a folder in googledrive]).
  2. If there are no [data-uppy-super-focusable] elements yet (or ever) - focuses on the first focusable element, but switches focus if superfocusable elements appear on next render.
*/
module.exports = function createSuperFocus () {
  let lastFocusWasOnSuperFocusableEl = false

  const superFocus = (dashboardEl, activeOverlayType) => {
    const overlayEl = getActiveOverlayEl(dashboardEl, activeOverlayType)

    const isFocusInOverlay = overlayEl.contains(document.activeElement)
    // If focus is already in the topmost overlay, AND on last update we focused on the superfocusable element - then leave focus up to the user.
    // [Practical check] without this line, typing in the search input in googledrive overlay won't work.
    if (isFocusInOverlay && lastFocusWasOnSuperFocusableEl) return

    const superFocusableEl = overlayEl.querySelector('[data-uppy-super-focusable]')
    // If we are already in the topmost overlay, AND there are no super focusable elements yet, - leave focus up to the user.
    // [Practical check] without this line, if you are in an empty folder in google drive, and something's uploading in the bg, - focus will be jumping to Done all the time.
    if (isFocusInOverlay && !superFocusableEl) return

    if (superFocusableEl) {
      superFocusableEl.focus({ preventScroll: true })
      lastFocusWasOnSuperFocusableEl = true
    } else {
      const firstEl = overlayEl.querySelector(FOCUSABLE_ELEMENTS)
      firstEl && firstEl.focus({ preventScroll: true })
      lastFocusWasOnSuperFocusableEl = false
    }
  }

  // ___Why do we need to debounce?
  //    1. To deal with animations: overlay changes via animations, which results in the DOM updating AFTER plugin.update() already executed.
  //    [Practical check] without debounce, if we open the Url overlay, and click 'Done', Dashboard won't get focused again.
  //    [Practical check] if we delay 250ms instead of 260ms - IE11 won't get focused in same situation.
  //    2. Performance: there can be many state update()s in a second, and this function is called every time.
  return debounce(superFocus, 260)
}
