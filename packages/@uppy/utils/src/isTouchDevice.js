export default function isTouchDevice () {
  return 'ontouchstart' in window || 'maxTouchPoints' in navigator
}
