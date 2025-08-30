import { CommonModule } from '@angular/common'
import { Component, type OnInit } from '@angular/core'
import { DashboardComponent, DashboardModalComponent } from '@uppy/angular'
import { Uppy } from '@uppy/core'
import Tus from '@uppy/tus'
import Webcam from '@uppy/webcam'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule, DashboardComponent, DashboardModalComponent],
})
export class AppComponent implements OnInit {
  title = 'Uppy Dashboard Angular Example'

  showModal = false

  dashboardProps = {
    plugins: ['Webcam'],
    height: 470,
    showProgressDetails: true,
    note: 'Images and video only, 2-3 files, up to 1 MB',
    restrictions: {
      maxFileSize: 1000000,
      maxNumberOfFiles: 3,
      allowedFileTypes: ['image/*', 'video/*'],
    },
  }

  dashboardModalProps = {
    target: document.body,
    onRequestCloseModal: (): void => {
      this.showModal = false
    },
    closeModalOnClickOutside: true,
    animateOpenClose: true,
  }

  uppy = new Uppy({
    debug: true,
    autoProceed: false,
    restrictions: {
      maxFileSize: 1000000,
      maxNumberOfFiles: 3,
      allowedFileTypes: ['image/*', 'video/*'],
    },
  })

  ngOnInit(): void {
    this.uppy
      .use(Webcam)
      .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' })
      .on('complete', (result) => {
        console.log("Upload complete! We've uploaded these files:", result)
      })
  }

  toggleModal(): void {
    this.showModal = !this.showModal
  }
}
