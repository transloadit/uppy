import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'

import { AppComponent } from './app.component'

import { UppyAngularDashboardModule, UppyAngularStatusBarModule } from '@uppy/angular'

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    UppyAngularDashboardModule,
    UppyAngularStatusBarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
class AppModule { }

export { AppModule }
