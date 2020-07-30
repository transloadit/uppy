import { Component, ChangeDetectionStrategy, Input, ElementRef, SimpleChange, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { Uppy } from '@uppy/core';
import * as StatusBar from '@uppy/status-bar';
import { UppyAngularWrapper } from '../../utils/wrapper';

@Component({
  selector: 'uppy-status-bar',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBarComponent extends UppyAngularWrapper implements OnDestroy, OnChanges  {
  @Input() uppy: Uppy;
  @Input() props: StatusBar.StatusBarOptions;

  constructor(public el: ElementRef) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.handleChanges(changes, StatusBar, { id: 'angular:StatusBar', target: this.el.nativeElement });
  }

  ngOnDestroy(): void {
    this.uninstall();
  }

}
