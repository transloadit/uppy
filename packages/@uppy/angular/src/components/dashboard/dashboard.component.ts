import type { OnChanges, OnDestroy, SimpleChanges } from '@angular/core'
import type { Body, Meta } from '@uppy/core'
import type { DashboardOptions } from '@uppy/dashboard'

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  inject,
} from '@angular/core'
import { Uppy } from '@uppy/core'
import Dashboard from '@uppy/dashboard'

import { UppyAngularWrapper } from '../../utils/wrapper'

@Component({
  selector: 'uppy-dashboard',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class DashboardComponent<M extends Meta, B extends Body>
  extends UppyAngularWrapper<M, B, DashboardOptions<M, B>>
  implements OnDestroy, OnChanges
{
  el = inject(ElementRef)

  @Input() uppy: Uppy<M, B> = new Uppy()
  @Input() props: DashboardOptions<M, B> = {}

  ngOnInit() {
    this.onMount(
      { id: 'angular:Dashboard', inline: true, target: this.el.nativeElement },
      Dashboard,
    )
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.handleChanges(changes, Dashboard)
  }

  ngOnDestroy(): void {
    this.uninstall()
  }
}
