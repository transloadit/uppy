import { Component, ChangeDetectionStrategy, Input, OnDestroy, OnChanges, SimpleChanges, ElementRef } from '@angular/core';
import { Uppy } from '@uppy/core';
import * as DragDrop from '@uppy/drag-drop';
import { UppyAngularWrapper } from '../../utils/wrapper';

@Component({
  selector: 'uppy-drag-drop',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DragDropComponent extends UppyAngularWrapper implements OnDestroy, OnChanges {
  @Input() uppy: Uppy;
  @Input() props: DragDrop.DragDropOptions;

  constructor(public el: ElementRef) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.handleChanges(changes, DragDrop, { id: 'angular:DragDrop', target: this.el.nativeElement });
  }

  ngOnDestroy(): void {
    this.uninstall();
  }

}
