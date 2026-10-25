import { expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-svelte'
import ThumbnailUnmount from '../src/components/test/thumbnail-unmount.svelte'

const isUsable = (url: string) =>
  fetch(url).then(
    () => true,
    () => false,
  )

// Preact runs effects after paint, which is when Thumbnail registers the
// cleanup that revokes its URL.
const afterPaint = () =>
  new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)))

test('Thumbnail revokes its object URL when it unmounts', async () => {
  const screen = await render(ThumbnailUnmount)
  const img = screen.getByAltText('cat.png')
  await expect.element(img).toBeInTheDocument()
  const url = img.element().getAttribute('src')!
  expect(await isUsable(url)).toBe(true)
  await afterPaint()

  await userEvent.click(screen.getByText('Toggle thumbnail'))

  await expect.poll(() => isUsable(url)).toBe(false)
})
