import { Component, ChangeDetectionStrategy, Input, ElementRef, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { Uppy } from '@uppy/core';
import StatusBar from '@uppy/status-bar';
import type { StatusBarOptions } from '@uppy/status-bar';
import { Body, Meta } from '@uppy/utils/lib/UppyFile';
import { UppyAngularWrapper } from '../../utils/wrapper';

@Component({
  selector: 'uppy-status-bar',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBarComponent<M extends Meta, B extends Body>
  extends UppyAngularWrapper<M, B, StatusBarOptions>
  implements OnDestroy, OnChanges
{
  el = inject(ElementRef);

  @Input() uppy: Uppy<M, B> = new Uppy();
  @Input() props: StatusBarOptions = {};

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    super();
  }

  ngOnInit() {
    this.onMount(
      { id: 'angular:StatusBar', target: this.el.nativeElement },
      StatusBar,
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.handleChanges(changes, StatusBar);
  }

  ngOnDestroy(): void {
    this.uninstall();
  }
}
