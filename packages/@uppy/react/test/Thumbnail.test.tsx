import { cleanup, render, screen } from '@testing-library/react'
import Uppy, { type UppyFile } from '@uppy/core'
import { Thumbnail, UppyContextProvider } from '@uppy/react'
import { afterEach, describe, expect, it } from 'vitest'

const instances: Uppy[] = []

afterEach(() => {
  cleanup()
  for (const uppy of instances.splice(0)) uppy.destroy()
})

function setup() {
  const uppy = new Uppy()
  instances.push(uppy)
  const file = uppy.getFile(
    uppy.addFile({
      name: 'cat.png',
      type: 'image/png',
      data: new Blob([new Uint8Array([137, 80, 78, 71])], {
        type: 'image/png',
      }),
    }),
  )
  const ui = (width: string) => (
    <UppyContextProvider uppy={uppy}>
      <Thumbnail file={file as UppyFile<any, any>} images width={width} />
    </UppyContextProvider>
  )
  return { ui }
}

// Thumbnail registers the cleanup that revokes its URL in an effect. Preact runs
// effects in a setTimeout queued from requestAnimationFrame, so wait for both.
const afterPaint = () =>
  new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)))

const shownUrl = () =>
  screen.findByAltText('cat.png').then((img) => img.getAttribute('src')!)

describe('Thumbnail', () => {
  it('keeps its object URL across re-renders', async () => {
    const { ui } = setup()
    const { rerender } = render(ui('100px'))
    const url = await shownUrl()

    rerender(ui('200px'))

    expect(await shownUrl()).toBe(url)
    expect(await fetch(url)).toBeDefined()
  })

  it('revokes its object URL when it unmounts', async () => {
    const { ui } = setup()
    const { unmount } = render(ui('100px'))
    const url = await shownUrl()
    expect(await fetch(url)).toBeDefined()
    await afterPaint()

    unmount()

    await expect(fetch(url)).rejects.toThrow()
  })
})
