import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentAttendance } from './parent-attendance';

describe('ParentAttendance', () => {
  let component: ParentAttendance;
  let fixture: ComponentFixture<ParentAttendance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParentAttendance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParentAttendance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
