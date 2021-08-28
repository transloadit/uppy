import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardModalComponent } from './dashboard-modal.component';

describe('DashboardComponent', () => {
  let component: DashboardModalComponent;
  let fixture: ComponentFixture<DashboardModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
