import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'

import {
  UppyAngularDashboardModalModule,
  UppyAngularDashboardModule,
  UppyAngularStatusBarModule,
} from '@uppy/angular'
import { AppComponent } from './app.component'

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    UppyAngularDashboardModule,
    UppyAngularStatusBarModule,
    UppyAngularDashboardModalModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
