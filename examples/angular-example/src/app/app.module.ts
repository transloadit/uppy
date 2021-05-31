import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'

import { AppComponent } from './app.component'

import { UppyAngularDashboardModule, UppyAngularStatusBarModule, UppyAngularDragDropModule, UppyAngularProgressBarModule, UppyAngularDashboardModalModule } from '@uppy/angular'

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    UppyAngularDashboardModule,
    UppyAngularStatusBarModule,
    UppyAngularDashboardModalModule,
    UppyAngularDragDropModule,
    UppyAngularProgressBarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
class AppModule { }

export { AppModule }
