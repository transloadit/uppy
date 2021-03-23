import { Component } from '@angular/core';
import { Uppy } from '@uppy/core'

@Component({
  selector: 'app-root',
  template: `
  <h1>Uppy Angular Example!</h1>
  <!-- <uppy-dashboard [uppy]='uppy' [props]='props'></uppy-dashboard> -->
  <uppy-status-bar [uppy]='uppy'></uppy-status-bar>
  `,
  styles: []
})
export class AppComponent {
  title = 'angular-example';
  props = {}

  uppy: Uppy

  ngOnInit() {
    this.uppy = new Uppy()
  }
}
