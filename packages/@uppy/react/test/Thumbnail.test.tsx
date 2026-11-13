import { cleanup, render } from '@testing-library/react'
import Uppy, { type UppyFile } from '@uppy/core'
import { Thumbnail, UppyContextProvider } from '@uppy/react'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'

afterEach(cleanup)

const cat = {
  name: 'cat.png',
  type: 'image/png',
  data: new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }),
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
})
