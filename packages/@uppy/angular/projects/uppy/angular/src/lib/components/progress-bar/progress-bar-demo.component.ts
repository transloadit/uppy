import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { Uppy } from '@uppy/core';
import Tus from '@uppy/tus';
import type {ProgressBarOptions} from '@uppy/progress-bar';
import { Body, Meta } from '@uppy/utils/lib/UppyFile';

@Component({
  selector: 'uppy-progress-bar-demo',
  template: `
    <section class="example-one">
      <h5>autoProceed is on</h5>

      <!-- Target DOM node #1 -->
      <uppy-drag-drop [uppy]="uppyOne"></uppy-drag-drop>

      <!-- Progress bar #1 -->
      <uppy-progress-bar [uppy]="uppyOne" [props]="props"></uppy-progress-bar>

      <!-- Uploaded files list #1 -->
      <div class="uploaded-files" *ngIf="fileListOne?.length">
        <h5>Uploaded files:</h5>
        <ol>
          <li *ngFor="let item of fileListOne">
            <a [href]="item.url" target="_blank"> {{ item.fileName }}</a>
          </li>
        </ol>
      </div>
    </section>

    <section class="example-two">
      <h5>autoProceed is off</h5>

      <!-- Target DOM node #1 -->
      <uppy-drag-drop [uppy]="uppyTwo"></uppy-drag-drop>

      <!-- Progress bar #1 -->
      <uppy-progress-bar [uppy]="uppyTwo" [props]="props"></uppy-progress-bar>

      <button (click)="upload()" class="upload-button">Upload</button>

      <!-- Uploaded files list #2 -->
      <div class="uploaded-files" *ngIf="fileListTwo?.length">
        <h5>Uploaded files:</h5>
        <ol>
          <li *ngFor="let item of fileListTwo">
            <a [href]="item.url" target="_blank"> {{ item.fileName }}</a>
          </li>
        </ol>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarDemoComponent<M extends Meta, B extends Body>
  implements OnInit
{
  private cdr = inject(ChangeDetectorRef);

  uppyOne!: Uppy<M, B>;
  uppyTwo!: Uppy<M, B>;
  fileListOne: { url: string; fileName: string }[] = [];
  fileListTwo: { url: string; fileName: string }[] = [];
  props: ProgressBarOptions = {
    hideAfterFinish: false,
  };

  upload(): void {
    this.uppyTwo.upload();
  }

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  updateFileList =
    (target: string) =>
    (file, response): void => {
      this[target] = [
        ...this[target],
        { url: response.uploadURL, fileName: file.name },
      ];
      this.cdr.markForCheck();
    };

  ngOnInit(): void {
    this.uppyOne = new Uppy<M, B>({ debug: true, autoProceed: true })
      .use(Tus, { endpoint: 'https://master.tus.io/files/' })
      .on('upload-success', this.updateFileList('fileListOne'));
    this.uppyTwo = new Uppy<M, B>({ debug: true, autoProceed: false })
      .use(Tus, { endpoint: 'https://master.tus.io/files/' })
      .on('upload-success', this.updateFileList('fileListTwo'));
  }
}
