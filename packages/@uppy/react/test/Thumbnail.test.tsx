import type { UppyFile } from '@uppy/core'

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import Uppy from '@uppy/core'
import { Thumbnail, UppyContextProvider } from '@uppy/react'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'

afterEach(cleanup)

const png = () =>
  new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' })

const cat = {
  name: 'cat.png',
  type: 'image/png',
  data: png(),
}

function TestUI({
  uppy,
  file,
  width,
}: {
  uppy: Uppy
  file: UppyFile<any, any>
  width: string
}) {
  return (
    <UppyContextProvider uppy={uppy}>
      <Thumbnail file={file} images width={width} />
    </UppyContextProvider>
  )
}

// Thumbnail registers the cleanup that revokes its URL in an effect. Preact runs
// effects in a setTimeout queued from requestAnimationFrame, so wait for both.
const afterPaint = () =>
  new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)))

const isUsable = (url: string) =>
  fetch(url).then(
    () => true,
    () => false,
  )

const addLocal = (uppy: Uppy, name: string) =>
  uppy.getFile(uppy.addFile({ name, type: 'image/png', data: png() }))

const addRemote = (uppy: Uppy, name: string, preview: string) =>
  uppy.getFile(
    uppy.addFile({
      name,
      type: 'image/png',
      data: { size: 4 },
      isRemote: true,
      remote: { companionUrl: 'https://companion.test', url: name },
      preview,
    } as Parameters<typeof uppy.addFile>[0]),
  )

const shownUrl = (name: string) =>
  screen.findByAltText(name).then((img) => img.getAttribute('src')!)

describe('Thumbnail', () => {
  it('keeps its object URL across re-renders', async () => {
    using uppy = new Uppy()
    const file = uppy.getFile(uppy.addFile(cat))
    const { rerender } = render(
      <TestUI uppy={uppy} file={file} width="100px" />,
    )
    const img = page.getByAltText('cat.png')
    await expect.element(img).toBeInTheDocument()
    const url = img.element().getAttribute('src')!

    rerender(<TestUI uppy={uppy} file={file} width="200px" />)

    await expect.element(img).toHaveAttribute('src', url)
    expect(await fetch(url)).toBeDefined()
  })

  it('revokes its object URL when it unmounts', async () => {
    using uppy = new Uppy()
    const file = uppy.getFile(uppy.addFile(cat))
    const { unmount } = render(<TestUI uppy={uppy} file={file} width="100px" />)
    const img = page.getByAltText('cat.png')
    await expect.element(img).toBeInTheDocument()
    const url = img.element().getAttribute('src')!
    expect(await fetch(url)).toBeDefined()
    await afterPaint()

    unmount()

    await expect(fetch(url)).rejects.toThrow()
  })

  it('revokes the object URL it created once it shows another local file', async () => {
    using uppy = new Uppy()
    const { rerender } = render(
      <TestUI uppy={uppy} file={addLocal(uppy, 'first.png')} width="100px" />,
    )
    const firstUrl = await shownUrl('first.png')
    expect(await isUsable(firstUrl)).toBe(true)

    rerender(
      <TestUI uppy={uppy} file={addLocal(uppy, 'second.png')} width="100px" />,
    )
    await shownUrl('second.png')

    await waitFor(async () => expect(await isUsable(firstUrl)).toBe(false))
  })

  it("leaves a remote file's preview URL usable once it shows another file", async () => {
    using uppy = new Uppy()
    const preview = URL.createObjectURL(png())
    const { rerender } = render(
      <TestUI
        uppy={uppy}
        file={addRemote(uppy, 'remote.png', preview)}
        width="100px"
      />,
    )
    expect(await shownUrl('remote.png')).toBe(preview)

    rerender(
      <TestUI uppy={uppy} file={addLocal(uppy, 'local.png')} width="100px" />,
    )
    const localUrl = await shownUrl('local.png')
    rerender(
      <TestUI uppy={uppy} file={addLocal(uppy, 'other.png')} width="100px" />,
    )
    await shownUrl('other.png')
    // The local URL's revocation shows the remote file's cleanup has run too.
    await waitFor(async () => expect(await isUsable(localUrl)).toBe(false))

    expect(await isUsable(preview)).toBe(true)
  })
})
