import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import Uppy from '@uppy/core'
import { UppyContextProvider, useScreenCapture } from '@uppy/react'
import ScreenCapture from '@uppy/screen-capture'
import { StrictMode, useEffect, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function fakeScreen() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 48
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'red'
  ctx.fillRect(0, 0, 64, 48)

  const streams: MediaStream[] = []
  const getDisplayMedia = vi
    .spyOn(navigator.mediaDevices, 'getDisplayMedia')
    .mockImplementation(() => {
      const stream = canvas.captureStream()
      streams.push(stream)
      return Promise.resolve(stream)
    })
  vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockImplementation(() =>
    Promise.resolve(canvas.captureStream()),
  )
  // Synthetic clicks grant no user activation, so Chromium rejects the
  // unmuted play() in captureScreenshot()
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  return { streams, getDisplayMedia }
}

const isLive = (stream: MediaStream) =>
  stream.getTracks().every((track) => track.readyState === 'live')

function Capture({ onSubmit }: { onSubmit?: () => void }) {
  const screenCapture = useScreenCapture({ onSubmit })
  const { start, stop } = screenCapture

  useEffect(() => {
    start()
    return () => stop()
  }, [start, stop])

  return (
    <div>
      <video {...screenCapture.getVideoProps()} />
      <button {...screenCapture.getScreenshotButtonProps()}>screenshot</button>
      <button {...screenCapture.getSubmitButtonProps()}>submit</button>
      <button {...screenCapture.getDiscardButtonProps()}>discard</button>
      <button type="button" onClick={() => start()}>
        start capture
      </button>
      <button type="button" onClick={() => stop()}>
        stop capture
      </button>
    </div>
  )
}

function setup(
  ui: React.ReactNode,
  uppyOpts?: ConstructorParameters<typeof Uppy<any, any>>[0],
) {
  const uppy = new Uppy<any, any>(uppyOpts).use(ScreenCapture)
  const result = render(
    <UppyContextProvider uppy={uppy}>{ui}</UppyContextProvider>,
  )
  return { uppy, ...result }
}

const button = (name: string) =>
  screen.getByRole('button', { name }) as HTMLButtonElement

async function click(name: string) {
  await act(async () => button(name).click())
}

async function waitForReady() {
  await waitFor(() => expect(button('screenshot').disabled).toBe(false))
}

describe('useScreenCapture', () => {
  let display: ReturnType<typeof fakeScreen>

  beforeEach(() => {
    display = fakeScreen()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('shows the stopped state when stop() is called while mounted', async () => {
    setup(<Capture />)
    await waitForReady()

    await click('stop capture')

    await waitFor(() => expect(button('screenshot').disabled).toBe(true))
    expect(isLive(display.streams[0]!)).toBe(false)

    await click('start capture')
    await waitForReady()
    expect(display.getDisplayMedia).toHaveBeenCalledTimes(2)
  })

  it('keeps capturing when the parent passes a new inline onSubmit', async () => {
    const calls: number[] = []
    function Parent() {
      const [renders, setRenders] = useState(0)
      return (
        <>
          <button type="button" onClick={() => setRenders((n) => n + 1)}>
            rerender
          </button>
          <Capture onSubmit={() => calls.push(renders)} />
        </>
      )
    }
    setup(<Parent />)
    await waitForReady()

    await click('rerender')
    await click('rerender')

    expect(display.getDisplayMedia).toHaveBeenCalledTimes(1)
    expect(isLive(display.streams[0]!)).toBe(true)

    await click('screenshot')
    await waitFor(() => expect(button('submit').disabled).toBe(false))
    await click('submit')
    expect(calls).toEqual([2])
  })

  it('does not call onSubmit or drop the preview when restrictions reject the capture', async () => {
    const onSubmit = vi.fn()
    const { uppy } = setup(<Capture onSubmit={onSubmit} />, {
      restrictions: { allowedFileTypes: ['application/pdf'] },
    })
    await waitForReady()

    await click('screenshot')
    await waitFor(() => expect(button('submit').disabled).toBe(false))
    await click('submit')

    expect(uppy.getFiles()).toHaveLength(0)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(button('submit').disabled).toBe(false)
    expect(isLive(display.streams[0]!)).toBe(true)

    await click('discard')
    await waitForReady()
  })

  it('stops the stream of a superseded start in StrictMode', async () => {
    const uppy = new Uppy().use(ScreenCapture)
    render(
      <StrictMode>
        <UppyContextProvider uppy={uppy}>
          <Capture />
        </UppyContextProvider>
      </StrictMode>,
    )
    await waitForReady()

    expect(display.streams.map(isLive)).toEqual([false, true])

    cleanup()
    expect(display.streams.map(isLive)).toEqual([false, false])
  })

  it('stops a stream that resolves after unmounting', async () => {
    let resolve!: () => void
    display.getDisplayMedia.mockImplementationOnce(async () => {
      await new Promise<void>((r) => {
        resolve = r
      })
      const stream = document.createElement('canvas').captureStream()
      display.streams.push(stream)
      return stream
    })
    const { unmount } = setup(<Capture />)
    await waitFor(() => expect(resolve).toBeDefined())

    unmount()
    await act(async () => resolve())

    await waitFor(() => expect(display.streams).toHaveLength(1))
    expect(isLive(display.streams[0]!)).toBe(false)
  })
})
