import { expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-svelte'
import ThumbnailUnmount from './ThumbnailUnmount.svelte'

// Thumbnail registers the cleanup that revokes its URL in an effect. Preact runs
// effects in a setTimeout queued from requestAnimationFrame, so wait for both.
const afterPaint = () =>
  new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)))

test('Thumbnail revokes its object URL when it unmounts', async () => {
  const screen = await render(ThumbnailUnmount)
  const img = screen.getByAltText('cat.png')
  await expect.element(img).toBeInTheDocument()
  const url = img.element().getAttribute('src')!
  expect(await fetch(url)).toBeDefined()
  await afterPaint()

  await userEvent.click(screen.getByText('Toggle thumbnail'))

  await expect(fetch(url)).rejects.toThrow()
})
