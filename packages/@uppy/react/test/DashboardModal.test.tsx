import { act, render } from '@testing-library/react'
import Uppy from '@uppy/core'
import type Dashboard from '@uppy/dashboard'
import DashboardModal from '@uppy/react/dashboard-modal'
import Webcam from '@uppy/webcam'
import { expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

it('releases the keyboard when an open modal is unmounted', async () => {
  using uppy = new Uppy()
  const onRequestClose = vi.fn()
  const { unmount } = render(
    <DashboardModal uppy={uppy} open onRequestClose={onRequestClose} />,
  )
  await vi.waitFor(() => {
    expect(document.querySelector('.uppy-Dashboard-browse')).not.toBeNull()
  })

  unmount()

  const before = document.createElement('button')
  const after = document.createElement('button')
  before.textContent = 'Before'
  after.textContent = 'After'
  document.body.append(before, after)
  try {
    before.focus()
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(after)
    await userEvent.keyboard('{Escape}')
    expect(onRequestClose).not.toHaveBeenCalled()
    expect(document.body.classList.contains('uppy-Dashboard-isFixed')).toBe(
      false,
    )
  } finally {
    before.remove()
    after.remove()
  }
})

it('stops rendering an open Camera panel after unmount', async () => {
  using uppy = new Uppy().use(Webcam)
  const webcam = uppy.getPlugin<Webcam<any, any>>('Webcam')!
  // This test exercises the panel lifecycle without requesting camera access.
  const start = vi.spyOn(webcam, 'start').mockResolvedValue()
  const renderCamera = vi.spyOn(webcam, 'render')
  const { unmount } = render(<DashboardModal uppy={uppy} open />)
  const dashboard = uppy.getPlugin<Dashboard<any, any>>('DashboardModal')!
  const root = dashboard.el!

  try {
    act(() => dashboard.showPanel('Webcam'))
    await vi.waitFor(() => expect(renderCamera).toHaveBeenCalled())
    unmount()
    uppy.destroy()
    renderCamera.mockClear()

    // Let the panel's 250ms slide transition finish if it was not disposed.
    await new Promise((resolve) => setTimeout(resolve, 350))
    expect(renderCamera).not.toHaveBeenCalled()
    expect(root.childElementCount).toBe(0)
  } finally {
    unmount()
    renderCamera.mockRestore()
    start.mockRestore()
  }
})
