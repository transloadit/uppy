import { Component } from '@angular/core';
import { Uppy } from '@uppy/core'
import Webcam from '@uppy/webcam'
import Tus from '@uppy/tus'
import GoogleDrive from '@uppy/google-drive'

@Component({
  selector: 'app-root',
  template: /*html*/`
  <h1>Uppy Angular Example!</h1>
  <h2>Inline dashboard</h2>
  <label>
		<input
      type="checkbox"
      (change)="showInline = $event.target.checked"
      [checked]="showInline"
    />
		Show Dashboard
	</label>

  <uppy-dashboard [uppy]='uppy' [props]='dashboardProps' *ngIf="showInline"></uppy-dashboard>

  <h2>Modal Dashboard</h2>
  <div>
    <uppy-dashboard-modal [uppy]='uppy' [open]='showModal' [props]='dashboardModalProps'></uppy-dashboard-modal>
    <button (click)="showModal = !showModal" >
      {{ showModal ? 'Close dashboard' : 'Open dashboard' }}
    </button>
  </div>

  <h2>
    Drag Drop Area
  </h2>
  <uppy-drag-drop [uppy]='uppy' [props]='{}'></uppy-drag-drop>

  <h2>Progress Bar</h2>
  <uppy-progress-bar [uppy]='uppy' [props]='{ hideAfterFinish: false }'></uppy-progress-bar>

  `,
  styleUrls: [
    '../../../../packages/@uppy/core/dist/style.min.css',
    '../../../../packages/@uppy/drag-drop/dist/style.min.css',
    '../../../../packages/@uppy/progress-bar/dist/style.min.css',
    '../../../../packages/@uppy/dashboard/dist/style.min.css',
  ]
})
export class AppComponent {
  title = 'angular-example';
  showInline = false
  showModal = false

  dashboardProps = {
    plugins: ['Webcam']
  }
  dashboardModalProps = {
    target: document.body,
    onRequestCloseModal: () => this.showModal = false
  }


  uppy: Uppy = new Uppy({ debug: true, autoProceed: true })
  ngOnInit() {
    this.uppy
      .use(Webcam)
      .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' })
      .use(GoogleDrive, { companionUrl: 'https://companion.uppy.io' })
  }
}
