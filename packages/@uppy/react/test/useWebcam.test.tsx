import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import Uppy from '@uppy/core'
import { UppyContextProvider, useWebcam } from '@uppy/react'
import Webcam, { type WebcamOptions } from '@uppy/webcam'
import { useEffect, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function fakeCamera() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 48
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'red'
  ctx.fillRect(0, 0, 64, 48)

  const streams: MediaStream[] = []
  vi.spyOn(navigator.mediaDevices, 'enumerateDevices').mockResolvedValue([
    { kind: 'videoinput', deviceId: 'cam', label: 'Cam', groupId: '' },
  ] as MediaDeviceInfo[])
  const getUserMedia = vi
    .spyOn(navigator.mediaDevices, 'getUserMedia')
    .mockImplementation(() => {
      const stream = canvas.captureStream()
      streams.push(stream)
      return Promise.resolve(stream)
    })
  return { streams, getUserMedia }
}

const isLive = (stream: MediaStream) =>
  stream.getTracks().every((track) => track.readyState === 'live')

function Camera({ onSubmit }: { onSubmit?: () => void }) {
  const webcam = useWebcam({ onSubmit })
  const { start, stop } = webcam

  useEffect(() => {
    start()
    return () => stop()
  }, [start, stop])

  return (
    <div>
      <video data-testid="video" {...webcam.getVideoProps()} />
      <button {...webcam.getSnapshotButtonProps()}>snapshot</button>
      <button {...webcam.getRecordButtonProps()}>record</button>
      <button {...webcam.getSubmitButtonProps()}>submit</button>
      <button {...webcam.getDiscardButtonProps()}>discard</button>
      <button type="button" onClick={() => start()}>
        start camera
      </button>
      <button type="button" onClick={() => stop()}>
        stop camera
      </button>
      <output data-testid="ready">{String(webcam.state.cameraReady)}</output>
    </div>
  )
}

function setup(
  ui: React.ReactNode,
  {
    uppyOpts,
    webcamOpts,
  }: {
    uppyOpts?: ConstructorParameters<typeof Uppy<any, any>>[0]
    webcamOpts?: WebcamOptions<any, any>
  } = {},
) {
  const uppy = new Uppy<any, any>(uppyOpts).use(Webcam, webcamOpts)
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
  await waitFor(() => expect(button('snapshot').disabled).toBe(false))
}

describe('useWebcam', () => {
  let camera: ReturnType<typeof fakeCamera>

  beforeEach(() => {
    camera = fakeCamera()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows the stopped state when stop() is called while mounted', async () => {
    setup(<Camera />)
    await waitForReady()

    await click('stop camera')

    await waitFor(() => expect(button('snapshot').disabled).toBe(true))
    expect(screen.getByTestId('ready').textContent).toBe('false')
    expect(isLive(camera.streams[0]!)).toBe(false)

    await click('start camera')
    await waitForReady()
    expect(camera.getUserMedia).toHaveBeenCalledTimes(2)
  })

  it('keeps the camera running when the parent passes a new inline onSubmit', async () => {
    const calls: number[] = []
    function Parent() {
      const [renders, setRenders] = useState(0)
      return (
        <>
          <button type="button" onClick={() => setRenders((n) => n + 1)}>
            rerender
          </button>
          <Camera onSubmit={() => calls.push(renders)} />
        </>
      )
    }
    setup(<Parent />)
    await waitForReady()

    await click('rerender')
    await click('rerender')

    expect(camera.getUserMedia).toHaveBeenCalledTimes(1)
    expect(isLive(camera.streams[0]!)).toBe(true)

    await click('snapshot')
    await waitFor(() => expect(button('submit').disabled).toBe(false))
    await click('submit')
    expect(calls).toEqual([2])
  })

  it('does not call onSubmit or drop the preview when restrictions reject the capture', async () => {
    const onSubmit = vi.fn()
    const { uppy } = setup(<Camera onSubmit={onSubmit} />, {
      uppyOpts: { restrictions: { allowedFileTypes: ['application/pdf'] } },
    })
    await waitForReady()

    await click('snapshot')
    await waitFor(() => expect(button('submit').disabled).toBe(false))
    await click('submit')

    expect(uppy.getFiles()).toHaveLength(0)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(button('submit').disabled).toBe(false)
    expect(isLive(camera.streams[0]!)).toBe(true)

    await click('discard')
    await waitForReady()
  })

  it('disables record when only pictures are allowed', async () => {
    setup(<Camera />, { webcamOpts: { modes: ['picture'] } })
    await waitForReady()
    expect(button('record').disabled).toBe(true)
  })

  it('disables snapshot when pictures are not allowed', async () => {
    setup(<Camera />, { webcamOpts: { modes: ['video-only'] } })
    await waitFor(() => expect(button('record').disabled).toBe(false))
    expect(button('snapshot').disabled).toBe(true)
  })

  it('disables record when the browser has no MediaRecorder', async () => {
    vi.stubGlobal('MediaRecorder', undefined)
    setup(<Camera />)
    await waitForReady()
    expect(button('record').disabled).toBe(true)
  })

  it('does not mirror the live preview when mirror is off', async () => {
    setup(<Camera />, { webcamOpts: { mirror: false } })
    await waitForReady()
    expect(screen.getByTestId('video').dataset.uppyMirrored).toBe('false')
  })
})
