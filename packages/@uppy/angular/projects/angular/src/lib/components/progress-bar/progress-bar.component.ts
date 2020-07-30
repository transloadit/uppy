import { Component, ChangeDetectionStrategy, ElementRef, Input, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { Uppy } from '@uppy/core';
import * as ProgressBar from '@uppy/progress-bar';
import { UppyAngularWrapper } from '../../utils/wrapper';

@Component({
  selector: 'uppy-progress-bar',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressBarComponent extends UppyAngularWrapper implements OnDestroy, OnChanges {
  @Input() uppy: Uppy;
  @Input() props: ProgressBar.ProgressBarOptions;

  constructor(public el: ElementRef) {
    super();
   }

  ngOnChanges(changes: SimpleChanges): void {
    this.handleChanges(changes, ProgressBar, { id: 'angular:ProgressBar', target: this.el.nativeElement });
  }

  ngOnDestroy(): void {
    this.uninstall();
  }
}
