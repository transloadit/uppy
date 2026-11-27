import Uppy from '@uppy/core'
import { h, render } from 'preact'
import { act } from 'preact/test-utils'
import { afterEach, beforeEach, expect, test } from 'vitest'

import FilesGrid from '../lib/FilesGrid.js'
import FilesList from '../lib/FilesList.js'
import { createUppyEventAdapter } from '../lib/uppyEventAdapter.js'

let container: HTMLElement
beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
})
afterEach(() => {
  act(() => render(null, container))
  container.remove()
})

test.each([
  ['FilesList', FilesList],
  ['FilesGrid', FilesGrid],
])('%s shows files added before it mounted', (_name, Component) => {
  using uppy = new Uppy()
  uppy.addFile({ name: 'a.txt', data: new File(['a'], 'a.txt') })
  const ctx = { uppy, status: 'ready' as const, progress: 0 }

  act(() => render(h(Component, { ctx }), container))
  expect(container.textContent).toContain('a.txt')

  act(() => {
    uppy.addFile({ name: 'b.txt', data: new File(['b'], 'b.txt') })
  })
  expect(container.textContent).toContain('b.txt')
})

test.each([
  ['FilesList', FilesList],
  ['FilesGrid', FilesGrid],
])('%s follows a new Uppy instance', (_name, Component) => {
  using first = new Uppy()
  first.addFile({ name: 'a.txt', data: new File(['a'], 'a.txt') })
  using second = new Uppy()
  second.addFile({ name: 'b.txt', data: new File(['b'], 'b.txt') })

  act(() =>
    render(
      h(Component, { ctx: { uppy: first, status: 'ready', progress: 0 } }),
      container,
    ),
  )
  act(() =>
    render(
      h(Component, { ctx: { uppy: second, status: 'ready', progress: 0 } }),
      container,
    ),
  )
  expect(container.textContent).toContain('b.txt')
  expect(container.textContent).not.toContain('a.txt')

  act(() =>
    render(
      h(Component, { ctx: { uppy: undefined, status: 'init', progress: 0 } }),
      container,
    ),
  )
  expect(container.textContent).not.toContain('b.txt')
})

test('the event adapter starts from the current state', () => {
  using uppy = new Uppy()
  const status: string[] = []
  const empty = createUppyEventAdapter({
    uppy,
    onStatusChange: (s) => status.push(s),
    onProgressChange: () => {},
  })
  empty.cleanup()

  uppy.addFile({ name: 'a.txt', data: new File(['a'], 'a.txt') })
  const withFiles = createUppyEventAdapter({
    uppy,
    onStatusChange: (s) => status.push(s),
    onProgressChange: () => {},
  })
  withFiles.cleanup()

  expect(status).toEqual(['init', 'ready'])
})
