/**
 * Get the declared text direction for an element.
 */

function getTextDirection(element?: HTMLElement): string | undefined {
  // There is another way to determine text direction using getComputedStyle(), as done here:
  // https://github.com/pencil-js/text-direction/blob/2a235ce95089b3185acec3b51313cbba921b3811/text-direction.js
  //
  // We do not use that approach because we are interested specifically in the _declared_ text direction.
  // If no text direction is declared, we have to provide our own explicit text direction so our
  // bidirectional CSS style sheets work.
  while (element && !element.dir) {
    element = element.parentNode as HTMLElement
  }
  return element?.dir
}

export default getTextDirection
