import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'

import {
  UppyAngularDashboardModule,
  UppyAngularStatusBarModule,
  UppyAngularDragDropModule,
  UppyAngularProgressBarModule,
  UppyAngularDashboardModalModule
} from '@uppy/angular'
import { AppComponent } from './app.component'

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    UppyAngularDashboardModule,
    UppyAngularStatusBarModule,
    UppyAngularDashboardModalModule,
    UppyAngularDragDropModule,
    UppyAngularProgressBarModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule { }
