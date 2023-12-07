export default function isTouchDevice(): boolean {
  return 'ontouchstart' in window || 'maxTouchPoints' in navigator
}
