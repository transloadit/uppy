import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  Input,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import Dashboard from '@uppy/dashboard';
import type { DashboardOptions } from '@uppy/dashboard';
import { Uppy } from '@uppy/core';
import { UppyAngularWrapper } from '../../utils/wrapper';
import { Body, Meta } from '@uppy/utils/lib/UppyFile';

@Component({
  selector: 'uppy-dashboard',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent<M extends Meta, B extends Body>
  extends UppyAngularWrapper<M, B, DashboardOptions<M,B>>
  implements OnDestroy, OnChanges
{
  @Input() uppy: Uppy<M, B> = new Uppy();
  @Input() props: DashboardOptions<M, B> = {};

  constructor(public el: ElementRef) {
    super();
  }

  ngOnInit() {
    this.onMount(
      { id: 'angular:Dashboard', inline: true, target: this.el.nativeElement },
      Dashboard,
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.handleChanges(changes, Dashboard);
  }

  ngOnDestroy(): void {
    this.uninstall();
  }
}
