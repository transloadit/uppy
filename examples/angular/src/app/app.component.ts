import { CommonModule } from '@angular/common'
import { Component, type OnInit } from '@angular/core'
import {
  DashboardComponent,
  DashboardModalComponent,
} from '@uppy/angular'
import { Uppy } from '@uppy/core'
import GoogleDrive from '@uppy/google-drive'
import Tus from '@uppy/tus'
import Webcam from '@uppy/webcam'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    DashboardComponent,
    DashboardModalComponent,
  ],
})
export class AppComponent implements OnInit {
  title = 'angular-example'

  showInline = false

  showModal = false

  dashboardProps = {
    plugins: ['Webcam'],
  }

  dashboardModalProps = {
    target: document.body,
    onRequestCloseModal: (): void => {
      this.showModal = false
    },
  }

  uppy = new Uppy({ debug: true, autoProceed: true })

  ngOnInit(): void {
    this.uppy
      .use(Webcam)
      .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' })
      .use(GoogleDrive, { companionUrl: 'https://companion.uppy.io' })
  }
}
