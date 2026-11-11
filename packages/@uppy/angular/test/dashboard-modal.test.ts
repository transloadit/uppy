// The components are compiled at runtime (JIT), so the compiler has to be loaded first.
import '@angular/compiler'
import { ChangeDetectorRef, Component, inject } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing'
import { Uppy } from '@uppy/core'
import type Dashboard from '@uppy/dashboard'
import { afterEach, beforeAll, expect, it } from 'vitest'
import { DashboardModalComponent } from '../src/public-api'

beforeAll(() => {
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting())
})

afterEach(() => {
  TestBed.resetTestingModule()
})

@Component({
  template: `<uppy-dashboard-modal [uppy]="uppy" [open]="open" [props]="props" />`,
  imports: [DashboardModalComponent],
})
class HostComponent {
  cdr = inject(ChangeDetectorRef)
  uppy = new Uppy()
  open = true
  props = { id: 'Modal', animateOpenClose: false }

  set(patch: Partial<Pick<HostComponent, 'uppy' | 'open'>>) {
    Object.assign(this, patch)
    this.cdr.markForCheck()
  }
}

function render(initial: Partial<Pick<HostComponent, 'open'>> = {}) {
  const fixture = TestBed.createComponent(HostComponent)
  Object.assign(fixture.componentInstance, initial)
  fixture.detectChanges()
  const update = (patch: Parameters<HostComponent['set']>[0]) => {
    fixture.componentInstance.set(patch)
    fixture.detectChanges()
  }
  return { fixture, host: fixture.componentInstance, update }
}

function isHidden(uppy: Uppy) {
  return uppy.getPlugin<Dashboard<any, any>>('Modal')!.getPluginState().isHidden
}

it('opens the modal when `open` is initially true', () => {
  // This used to throw "Cannot read properties of undefined (reading 'openModal')",
  // because Angular calls `ngOnChanges` before `ngOnInit` mounts the plugin.
  const { fixture, host, update } = render({ open: true })
  expect(isHidden(host.uppy)).toBe(false)

  update({ open: false })
  expect(isHidden(host.uppy)).toBe(true)

  update({ open: true })
  expect(isHidden(host.uppy)).toBe(false)
  fixture.destroy()
})

it('keeps the modal closed when `open` is initially false', () => {
  const { fixture, host, update } = render({ open: false })
  expect(isHidden(host.uppy)).toBe(true)

  update({ open: true })
  expect(isHidden(host.uppy)).toBe(false)
  fixture.destroy()
})

it('keeps the modal open when the `uppy` instance is swapped', () => {
  const { fixture, update } = render({ open: true })
  const next = new Uppy()
  update({ uppy: next })
  expect(isHidden(next)).toBe(false)

  update({ open: false })
  expect(isHidden(next)).toBe(true)
  fixture.destroy()
})
