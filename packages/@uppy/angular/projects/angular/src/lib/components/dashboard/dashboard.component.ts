import { Component, ChangeDetectionStrategy, ElementRef, Input, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import * as Dashboard from '@uppy/dashboard';
import { Uppy } from '@uppy/core';
import { UppyAngularWrapper } from '../../utils/wrapper';

@Component({
  selector: 'uppy-dashboard',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent extends UppyAngularWrapper implements OnDestroy, OnChanges {
  @Input() uppy: Uppy;
  @Input() props: Dashboard.DashboardOptions;

  constructor(public el: ElementRef) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.handleChanges(changes, Dashboard, { id: 'angular:Dashboard', inline: true, target: this.el.nativeElement });
  }

  ngOnDestroy(): void {
    this.uninstall();
  }

}
