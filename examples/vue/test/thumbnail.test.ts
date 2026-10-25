import Uppy from '@uppy/core'
import { Thumbnail, UppyContextProvider } from '@uppy/vue'
import { expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-vue'
import { defineComponent, h, ref } from 'vue'

const isUsable = (url: string) =>
  fetch(url).then(
    () => true,
    () => false,
  )

// Preact runs effects after paint, which is when Thumbnail registers the
// cleanup that revokes its URL.
const afterPaint = () =>
  new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)))

const uppy = new Uppy()
const file = uppy.getFile(
  uppy.addFile({
    name: 'cat.png',
    type: 'image/png',
    data: new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }),
  }),
)

const ThumbnailUnmount = defineComponent({
  setup() {
    const shown = ref(true)
    return () =>
      h(UppyContextProvider, { uppy }, () => [
        h(
          'button',
          { type: 'button', onClick: () => (shown.value = !shown.value) },
          'Toggle thumbnail',
        ),
        shown.value ? h(Thumbnail, { file, images: true }) : null,
      ])
  },
})

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
