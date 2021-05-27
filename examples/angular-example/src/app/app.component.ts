import { Component } from '@angular/core';
import { Uppy } from '@uppy/core'

@Component({
  selector: 'app-root',
  template: `
  <h1>Uppy Angular Example!</h1>
  <!-- <uppy-dashboard [uppy]='uppy' [props]='props'></uppy-dashboard> -->
  <uppy-dashboard [uppy]='uppy'></uppy-dashboard>
  `,
  styleUrls: [
    '../../../../packages/@uppy/core/dist/style.css',
    '../../../../packages/@uppy/dashboard/dist/style.css',
  ]
})
export class AppComponent {
  title = 'angular-example';
  props = {}

  uppy: Uppy

  ngOnInit() {
    this.uppy = new Uppy()
  }
}
