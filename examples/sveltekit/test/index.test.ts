import { userEvent } from '@vitest/browser/context'
import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-svelte'
import PropsReactivity from '../src/components/test/props-reactivity.svelte'
import App from '../src/routes/+page.svelte'

const createMockFile = (name: string, type: string, size: number = 1024) => {
  return new File(['test content'], name, { type })
}

describe('App', () => {
  test('renders all main sections and upload button is initially disabled', async () => {
    const screen = render(App)

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
    const screen = render(App)

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
    const screen = render(App)

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
    const screen = render(App)

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
    const screen = render(App)

    await screen.getByRole('button', { name: 'Dropbox', exact: true }).click()

    const loginButton = screen.getByRole('button', { name: 'Login' })
    await expect.element(loginButton).toBeInTheDocument()

    await loginButton.click()
    await expect.element(loginButton).toBeInTheDocument()
  })
})

test('Dashboard reacts to prop changes', async () => {
  const screen = render(PropsReactivity)
  const toggleButton = screen.getByText('Toggle dashboard')
  const dashboard = screen.container.querySelector('.uppy-Dashboard')

  expect(dashboard).toBeTruthy()
  expect(dashboard?.ariaDisabled).toEqual('false')
  await userEvent.click(toggleButton)
  expect(dashboard?.ariaDisabled).toEqual('true')
})

test('StatusBar reacts to prop changes', async () => {
  const screen = render(PropsReactivity)
  const toggleButton = screen.getByText('Toggle statusbar')

  expect(
    screen.container.querySelector('#statusbar-container .uppy-c-btn-primary'),
  ).toBeVisible()
  await userEvent.click(toggleButton)
  expect(
    screen.container.querySelector('#statusbar-container .uppy-c-btn-primary'),
  ).toEqual(null)
})
