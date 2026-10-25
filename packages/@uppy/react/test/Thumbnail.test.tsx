import { cleanup, render, screen, waitFor } from '@testing-library/react'
import Uppy, { type UppyFile } from '@uppy/core'
import { Thumbnail, UppyContextProvider } from '@uppy/react'
import { afterEach, describe, expect, it } from 'vitest'

const instances: Uppy[] = []

afterEach(() => {
  cleanup()
  for (const uppy of instances.splice(0)) uppy.destroy()
})

const png = () =>
  new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' })

const isUsable = (url: string) =>
  fetch(url).then(
    () => true,
    () => false,
  )

function setup() {
  const uppy = new Uppy()
  instances.push(uppy)
  const addLocal = (name: string) =>
    uppy.getFile(uppy.addFile({ name, type: 'image/png', data: png() }))
  const addRemote = (name: string, preview: string) =>
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
  const ui = (file: UppyFile<any, any>) => (
    <UppyContextProvider uppy={uppy}>
      <Thumbnail file={file} images />
    </UppyContextProvider>
  )
  return { addLocal, addRemote, ui }
}

const shownUrl = (name: string) =>
  screen.findByAltText(name).then((img) => img.getAttribute('src')!)

describe('Thumbnail', () => {
  it('revokes the object URL it created once it shows another local file', async () => {
    const { addLocal, ui } = setup()
    const { rerender } = render(ui(addLocal('first.png')))
    const firstUrl = await shownUrl('first.png')
    expect(await isUsable(firstUrl)).toBe(true)

    rerender(ui(addLocal('second.png')))
    await shownUrl('second.png')

    await waitFor(async () => expect(await isUsable(firstUrl)).toBe(false))
  })

  it("leaves a remote file's preview URL usable once it shows another file", async () => {
    const { addLocal, addRemote, ui } = setup()
    const preview = URL.createObjectURL(png())
    const { rerender } = render(ui(addRemote('remote.png', preview)))
    expect(await shownUrl('remote.png')).toBe(preview)

    rerender(ui(addLocal('local.png')))
    const localUrl = await shownUrl('local.png')
    rerender(ui(addLocal('other.png')))
    await shownUrl('other.png')
    // The local URL's revocation shows the remote file's cleanup has run too.
    await waitFor(async () => expect(await isUsable(localUrl)).toBe(false))

    expect(await isUsable(preview)).toBe(true)
  })
})
