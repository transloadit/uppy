module.exports = [
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
