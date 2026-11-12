import { TestBed } from '@angular/core/testing'
import { AppComponent } from './app.component'

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents()
  })

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent)
    fixture.detectChanges()
    const app = fixture.componentInstance
    expect(app).toBeTruthy()
  })

  it(`should have as title 'Uppy Dashboard Angular Example'`, () => {
    const fixture = TestBed.createComponent(AppComponent)
    fixture.detectChanges()
    const app = fixture.componentInstance
    expect(app.title).toEqual('Uppy Dashboard Angular Example')
  })

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent)
    fixture.detectChanges()
    const compiled = fixture.nativeElement as HTMLElement
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Uppy Dashboard Angular Example',
    )
  })
})
