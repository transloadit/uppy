import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef,
} from '@angular/core';
import { Uppy } from '@uppy/core';
import DragDrop from '@uppy/drag-drop';
import type { DragDropOptions } from '@uppy/drag-drop';
import { Body, Meta } from '@uppy/utils/lib/UppyFile';
import { UppyAngularWrapper } from '../../utils/wrapper';

@Component({
  selector: 'uppy-drag-drop',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DragDropComponent<M extends Meta, B extends Body>
  extends UppyAngularWrapper<M, B, DragDropOptions>
  implements OnDestroy, OnChanges
{
  @Input() uppy: Uppy<M, B> = new Uppy();
  @Input() props: DragDropOptions = {};

  constructor(public el: ElementRef) {
    super();
  }

  ngOnInit() {
    this.onMount(
      { id: 'angular:DragDrop', target: this.el.nativeElement },
      DragDrop,
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.handleChanges(changes, DragDrop);
  }

  ngOnDestroy(): void {
    this.uninstall();
  }
}
