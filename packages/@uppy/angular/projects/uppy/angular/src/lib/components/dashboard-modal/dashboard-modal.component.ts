import { Component, ChangeDetectionStrategy, ElementRef, Input, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import Dashboard from '@uppy/dashboard';
import type { DashboardOptions } from '@uppy/dashboard';
import { Uppy } from '@uppy/core';
import { UppyAngularWrapper } from '../../utils/wrapper';
import { Body, Meta } from '@uppy/utils/lib/UppyFile';

@Component({
  selector: 'uppy-dashboard-modal',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardModalComponent<M extends Meta, B extends Body>
  extends UppyAngularWrapper<M, B, DashboardOptions<M, B>, Dashboard<M, B>>
  implements OnDestroy, OnChanges
{
  el = inject(ElementRef);

  @Input() uppy: Uppy<M, B> = new Uppy();
  @Input() props: DashboardOptions<M, B> = {};
  @Input() open: boolean = false;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    super();
  }

  ngOnInit() {
    this.onMount(
      {
        id: 'angular:DashboardModal',
        inline: false,
        target: this.el.nativeElement,
      },
      Dashboard,
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.handleChanges(changes, Dashboard);
    // Handle dashboard-modal specific changes
    if (changes['open'] && this.open !== changes['open'].previousValue) {
      if (this.open && !changes['open'].previousValue) {
        this.plugin!.openModal();
      }
      if (!this.open && changes['open'].previousValue) {
        this.plugin!.closeModal();
      }
    }
  }

  ngOnDestroy(): void {
    this.uninstall();
  }
}
