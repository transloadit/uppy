import Uppy from '@uppy/core'
import UppyScreenCapture from '@uppy/screen-capture'
import { UppyContextProvider } from '@uppy/vue'
import UppyWebcam from '@uppy/webcam'
import { HttpResponse, http } from 'msw'
import { setupWorker } from 'msw/browser'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-vue'
import { type Component, defineComponent, h } from 'vue'
import {
  describeModalEsc,
  describeRemoteSource,
} from '../../shared/remoteSourceTests.js'
import App from '../src/App.vue'
import RemoteSource from '../src/RemoteSource.vue'
import ScreenCapture from '../src/ScreenCapture.vue'
import Webcam from '../src/Webcam.vue'

const TUS_ENDPOINT = 'https://tusd.tusdemo.net/files/'

/**
 * MSW handlers that mock the tus resumable upload protocol.
 *
 * Handles the tus v1 flow used by the example tests:
 * 1. POST /files/ — create upload, return Location header
 * 2. PATCH /files/:id — receive chunk, return new Upload-Offset
 *
 * See https://tus.io/protocols/resumable-upload#protocol
 */
const worker = setupWorker(
  http.post(TUS_ENDPOINT, ({ request }) => {
    const uploadLength = request.headers.get('Upload-Length') || '0'
    return new HttpResponse(null, {
      status: 201,
      headers: {
        Location: `${TUS_ENDPOINT}mock-upload-id`,
        'Tus-Resumable': '1.0.0',
        'Upload-Offset': '0',
        'Upload-Length': uploadLength,
      },
    })
  }),
  http.patch(`${TUS_ENDPOINT}:id`, async ({ request }) => {
    const uploadOffset = request.headers.get('Upload-Offset') || '0'
    const body = await request.arrayBuffer()
    const newOffset = Number.parseInt(uploadOffset, 10) + body.byteLength
    return new HttpResponse(null, {
      status: 204,
      headers: {
        'Tus-Resumable': '1.0.0',
        'Upload-Offset': String(newOffset),
      },
    })
  }),
)

beforeAll(async () => {
  await worker.start({ onUnhandledRequest: 'error' })
})
afterAll(() => {
  worker.stop()
})

const createMockFile = (name: string, type: string) => {
  return new File(['test content'], name, { type })
}

describe('App', () => {
  test('renders all main sections and upload button is initially disabled', async () => {
    const screen = await render(App)

    await expect.element(screen.getByText('With list')).toBeInTheDocument()
    await expect.element(screen.getByText('With grid')).toBeInTheDocument()
    await expect
      .element(screen.getByText('With custom dropzone'))
      .toBeInTheDocument()

    const uploadButton = screen.getByRole('button', { name: /upload/i })
    await expect.element(uploadButton).toBeInTheDocument()
    await expect.element(uploadButton).toBeDisabled()
  })

  test('can add and remove files and upload', async () => {
    const screen = await render(App)

    const fileInput = document.getElementById(
      'uppy-dropzone-file-input-uppy',
    ) as Element
    await userEvent.upload(fileInput, createMockFile('test.txt', 'text/plain'))

    // for list and grid
    for (const element of screen.getByText('test.txt').elements()) {
      await expect.element(element).toBeInTheDocument()
    }
    await screen.getByText('remove').first().click()
    for (const element of screen.getByText('test.txt').elements()) {
      await expect.element(element).not.toBeInTheDocument()
    }

    await userEvent.upload(fileInput, createMockFile('test.txt', 'text/plain'))
    await screen.getByRole('button', { name: /upload/i }).click()
    await expect
      .element(screen.getByRole('button', { name: /complete/i }))
      .toBeInTheDocument()
  })
})

describe('ScreenCapture Component', () => {
  test('renders with title, control buttons, and close functionality works', async () => {
    const screen = await render(App)

    await screen
      .getByRole('button', { name: 'Screen Capture', exact: true })
      .click()

    await expect
      .element(screen.getByRole('heading', { name: 'Screen Capture' }))
      .toBeInTheDocument()

    await expect
      .element(screen.getByRole('button', { name: 'Screenshot' }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: 'Record' }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: 'Stop' }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: 'Submit' }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: 'Discard' }))
      .toBeInTheDocument()

    const closeButton = screen.getByText('✕')
    await closeButton.click()
  })
})

describe('Webcam Component', () => {
  test('renders with title, control buttons, and close functionality works', async () => {
    const screen = await render(App)

    await screen.getByRole('button', { name: 'Webcam', exact: true }).click()

    await expect
      .element(screen.getByRole('heading', { name: 'Camera' }))
      .toBeInTheDocument()

    await expect
      .element(screen.getByRole('button', { name: 'Snapshot' }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: 'Record' }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: 'Stop' }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: 'Submit' }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: 'Discard' }))
      .toBeInTheDocument()

    const closeButton = screen.getByText('✕')
    await closeButton.click()
  })
})

describe('RemoteSource Component', () => {
  test('renders login button and login interaction works', async () => {
    const screen = await render(App)

    await screen.getByRole('button', { name: 'Dropbox', exact: true }).click()

    const loginButton = screen.getByRole('button', { name: 'Login' })
    await expect.element(loginButton).toBeInTheDocument()

    await loginButton.click()
  })
})

const withUppy = (uppy: Uppy<any, any>, child: Component, props: object) =>
  defineComponent({
    setup: () => () =>
      h(UppyContextProvider, { uppy }, { default: () => h(child, props) }),
  })

describeRemoteSource(async (uppy, close) =>
  render(withUppy(uppy, RemoteSource, { id: 'Dropbox', close })),
)

describeModalEsc(async () => render(App))

describe('Media capture lifecycle', () => {
  test('Webcam stops the camera on unmount', async () => {
    const uppy = new Uppy().use(UppyWebcam)
    const plugin = uppy.getPlugin('Webcam') as any
    const screen = render(withUppy(uppy, Webcam, { close: () => {} }))
    await expect
      .element(screen.getByRole('heading', { name: 'Camera' }))
      .toBeInTheDocument()
    // installed after mount, so a stop() from a failed start() can't count
    const stop = vi.spyOn(plugin, 'stop').mockImplementation(async () => {})
    await screen.unmount()
    expect(stop).toHaveBeenCalled()
  })

  test('ScreenCapture stops the capture on unmount', async () => {
    const uppy = new Uppy().use(UppyScreenCapture)
    const plugin = uppy.getPlugin('ScreenCapture') as any
    const screen = render(withUppy(uppy, ScreenCapture, { close: () => {} }))
    await expect
      .element(screen.getByRole('heading', { name: 'Screen Capture' }))
      .toBeInTheDocument()
    const stop = vi.spyOn(plugin, 'stop').mockImplementation(() => {})
    await screen.unmount()
    expect(stop).toHaveBeenCalled()
  })
})
