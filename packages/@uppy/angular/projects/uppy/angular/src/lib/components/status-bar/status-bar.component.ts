import {
  Component,
  ChangeDetectionStrategy,
  Input,
  ElementRef,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Uppy } from '@uppy/core';
// @ts-expect-error
import StatusBar from '@uppy/status-bar';
// @ts-expect-error
import type { StatusBarOptions } from '@uppy/status-bar';
import { UppyAngularWrapper } from '../../utils/wrapper';
import { Body, Meta } from '@uppy/utils/lib/UppyFile';

@Component({
  selector: 'uppy-status-bar',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBarComponent<M extends Meta, B extends Body>
  extends UppyAngularWrapper<M, B>
  implements OnDestroy, OnChanges
{
  @Input() uppy: Uppy<M, B> = new Uppy();
  @Input() props: StatusBarOptions = {};

  constructor(public el: ElementRef) {
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
