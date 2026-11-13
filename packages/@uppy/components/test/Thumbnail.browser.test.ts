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
  test.each([
    'image/svg+xml',
    'text/html',
  ])('does not create a blob document for %s, even with image metadata', (type) => {
    using uppy = new Uppy()
    const id = uppy.addFile({
      name: 'drawing.svg',
      data: new File(
        [
          '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        ],
        'drawing.svg',
        { type },
      ),
    })
    uppy.setFileState(id, { type: 'image/png' })
    using createUrl = vi.spyOn(URL, 'createObjectURL')
    act(() =>
      render(h(Thumbnail, { file: uppy.getFile(id), images: true }), container),
    )
    expect(createUrl).not.toHaveBeenCalled()
  })

  test('renders raster images and revokes only its own object URL', async () => {
    const png = Uint8Array.from(
      atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=',
      ),
      (char) => char.charCodeAt(0),
    )
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
})
