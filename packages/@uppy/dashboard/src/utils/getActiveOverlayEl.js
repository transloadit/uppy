/**
 * @returns {HTMLElement} - either dashboard element, or the overlay that's most on top
 */
module.exports = function getActiveOverlayEl (dashboardEl, activeOverlayType) {
  if (activeOverlayType) {
    const overlayEl = dashboardEl.querySelector(`[data-uppy-paneltype="${activeOverlayType}"]`)
    // if an overlay is already mounted
    if (overlayEl) return overlayEl
  }
  return dashboardEl
}
