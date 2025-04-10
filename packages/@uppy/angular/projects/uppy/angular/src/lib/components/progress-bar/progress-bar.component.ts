import { Component, ChangeDetectionStrategy, ElementRef, Input, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { Uppy } from '@uppy/core';
import ProgressBar from '@uppy/progress-bar';
import type { ProgressBarOptions } from '@uppy/progress-bar';
import { Body, Meta } from '@uppy/utils/lib/UppyFile';
import { UppyAngularWrapper } from '../../utils/wrapper';

@Component({
  selector: 'uppy-progress-bar',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent<M extends Meta, B extends Body>
  extends UppyAngularWrapper<M, B, ProgressBarOptions>
  implements OnDestroy, OnChanges
{
  el = inject(ElementRef);

  @Input() uppy: Uppy<M, B> = new Uppy();
  @Input() props: ProgressBarOptions = {};

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    super();
  }

  ngOnInit() {
    this.onMount(
      { id: 'angular:ProgressBar', target: this.el.nativeElement },
      ProgressBar,
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.handleChanges(changes, ProgressBar);
  }

  ngOnDestroy(): void {
    this.uninstall();
  }
}
