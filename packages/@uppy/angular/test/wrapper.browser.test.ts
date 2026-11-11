import '@angular/compiler'
import {
  type ApplicationRef,
  type ComponentRef,
  createComponent,
  provideZonelessChangeDetection,
} from '@angular/core'
import { createApplication } from '@angular/platform-browser'
import Uppy from '@uppy/core'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  DashboardComponent,
  DashboardModalComponent,
  StatusBarComponent,
} from '../src/public-api'

type Wrapper =
  | DashboardComponent<any, any>
  | DashboardModalComponent<any, any>
  | StatusBarComponent<any, any>

let app: ApplicationRef
const refs: ComponentRef<Wrapper>[] = []

// Every Uppy instance adds one `online` listener to `window` in its constructor and removes
// it in `destroy()`, so this is the number of instances that are still alive.
let liveInstances = 0
beforeEach(() => {
  liveInstances = 0
  const add = window.addEventListener
  const remove = window.removeEventListener
  vi.spyOn(window, 'addEventListener').mockImplementation(function (
    this: Window,
    ...args
  ) {
    if (args[0] === 'online') liveInstances++
    return add.apply(this, args)
  })
  vi.spyOn(window, 'removeEventListener').mockImplementation(function (
    this: Window,
    ...args
  ) {
    if (args[0] === 'online') liveInstances--
    return remove.apply(this, args)
  })
})

beforeAll(async () => {
  app = await createApplication({
    providers: [provideZonelessChangeDetection()],
  })
})

afterEach(() => {
  for (const ref of refs.splice(0)) ref.destroy()
  vi.restoreAllMocks()
})

function mount(
  component: new (...args: any[]) => Wrapper,
  inputs: Record<string, unknown> = {},
) {
  const ref = createComponent(component, {
    environmentInjector: app.injector,
    hostElement: document.body.appendChild(document.createElement('div')),
  })
  refs.push(ref)
  for (const [name, value] of Object.entries(inputs)) ref.setInput(name, value)
  ref.changeDetectorRef.detectChanges()
  return {
    ref,
    set(name: string, value: unknown) {
      ref.setInput(name, value)
      ref.changeDetectorRef.detectChanges()
    },
    unmount() {
      refs.splice(refs.indexOf(ref), 1)
      ref.destroy()
    },
  }
}

describe.each([
  ['DashboardComponent', DashboardComponent, 'angular:Dashboard'],
  [
    'DashboardModalComponent',
    DashboardModalComponent,
    'angular:DashboardModal',
  ],
  ['StatusBarComponent', StatusBarComponent, 'angular:StatusBar'],
] as const)('%s', (_, component, pluginId) => {
  it('creates and destroys its own Uppy instance when none is passed in', () => {
    for (let i = 0; i < 3; i++) {
      const { ref, unmount } = mount(component)
      expect(liveInstances).toBe(1)
      expect(ref.instance.uppy.getPlugin(pluginId)).toBeDefined()
      unmount()
      expect(liveInstances).toBe(0)
    }
  })

  it('does not create or destroy an instance when one is passed in', () => {
    const uppy = new Uppy()
    const destroy = vi.spyOn(uppy, 'destroy')
    const { unmount } = mount(component, { uppy })
    expect(liveInstances).toBe(1)
    expect(uppy.getPlugin(pluginId)).toBeDefined()
    unmount()
    expect(uppy.getPlugin(pluginId)).toBeUndefined()
    expect(destroy).not.toHaveBeenCalled()
    expect(liveInstances).toBe(1)
    uppy.destroy()
  })

  it('moves the plugin when the bound instance changes, falling back to its own', () => {
    const x = new Uppy()
    const y = new Uppy()
    const destroyX = vi.spyOn(x, 'destroy')
    const destroyY = vi.spyOn(y, 'destroy')

    // Bound, but not set yet: uses an instance of its own until it is.
    const { ref, set, unmount } = mount(component, { uppy: undefined })
    const own = ref.instance.uppy
    expect(own).not.toBe(x)
    expect(own.getPlugin(pluginId)).toBeDefined()
    expect(liveInstances).toBe(3)

    set('uppy', null)
    expect(ref.instance.uppy).toBe(own)
    expect(liveInstances).toBe(3)

    set('uppy', x)
    expect(x.getPlugin(pluginId)).toBeDefined()
    expect(liveInstances).toBe(2)

    set('uppy', y)
    expect(x.getPlugin(pluginId)).toBeUndefined()
    expect(y.getPlugin(pluginId)).toBeDefined()

    set('uppy', undefined)
    expect(y.getPlugin(pluginId)).toBeUndefined()
    expect(ref.instance.uppy.getPlugin(pluginId)).toBeDefined()
    expect(liveInstances).toBe(3)

    set('uppy', x)
    expect(x.getPlugin(pluginId)).toBeDefined()
    expect(liveInstances).toBe(2)

    unmount()
    expect(x.getPlugin(pluginId)).toBeUndefined()
    expect(destroyX).not.toHaveBeenCalled()
    expect(destroyY).not.toHaveBeenCalled()
    x.destroy()
    y.destroy()
    expect(liveInstances).toBe(0)
  })
})
