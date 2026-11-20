import Uppy from '@uppy/core'
import { h, render } from 'preact'
import { act } from 'preact/test-utils'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import Thumbnail from '../lib/Thumbnail.js'

let container: HTMLElement
beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
})
afterEach(() => {
  act(() => render(null, container))
  container.remove()
})

describe('local thumbnail documents', () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'

  test.each([
    'image/svg+xml',
    'text/html',
  ])('a %s file labelled as PNG only gets an image/png URL', async (type) => {
    using uppy = new Uppy()
    const id = uppy.addFile({
      name: 'drawing.svg',
      data: new File([svg], 'drawing.svg', { type }),
    })
    uppy.setFileState(id, { type: 'image/png' })
    using createUrl = vi.spyOn(URL, 'createObjectURL')
    act(() =>
      render(h(Thumbnail, { file: uppy.getFile(id), images: true }), container),
    )
    expect(createUrl).toHaveBeenCalledTimes(1)
    // Opened as a document, the URL is an image that fails to decode, not a page
    const blob = await (await fetch(createUrl.mock.results[0]?.value)).blob()
    expect(blob.type).toBe('image/png')
  })

  test('an SVG file gets no object URL', () => {
    using uppy = new Uppy()
    const id = uppy.addFile({
      name: 'drawing.svg',
      data: new File([svg], 'drawing.svg', { type: 'image/svg+xml' }),
    })
    using createUrl = vi.spyOn(URL, 'createObjectURL')
    act(() =>
      render(h(Thumbnail, { file: uppy.getFile(id), images: true }), container),
    )
    expect(createUrl).not.toHaveBeenCalled()
  })

  const png = Uint8Array.from(
    atob(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=',
    ),
    (char) => char.charCodeAt(0),
  )

  test('renders raster images and revokes only its own object URL', async () => {
    using uppy = new Uppy()
    const id = uppy.addFile({
      name: 'image.png',
      data: new File([png], 'image.png', { type: 'image/png' }),
    })
    using createUrl = vi.spyOn(URL, 'createObjectURL')
    using revokeUrl = vi.spyOn(URL, 'revokeObjectURL')
    act(() =>
      render(h(Thumbnail, { file: uppy.getFile(id), images: true }), container),
    )
    await expect
      .element(page.getByRole('img', { name: 'image.png' }))
      .toBeVisible()
    expect(createUrl).toHaveBeenCalledTimes(1)
    const url = createUrl.mock.results[0]?.value
    act(() => render(null, container))
    expect(revokeUrl).toHaveBeenCalledWith(url)
  })

  test('previews a raster image whose Blob has no type', async () => {
    using uppy = new Uppy()
    const id = uppy.addFile({
      name: 'image.png',
      data: new Blob([png]),
    })
    expect(uppy.getFile(id).type).toBe('image/png')
    act(() =>
      render(h(Thumbnail, { file: uppy.getFile(id), images: true }), container),
    )
    await expect
      .element(page.getByRole('img', { name: 'image.png' }))
      .toBeVisible()
  })
})
