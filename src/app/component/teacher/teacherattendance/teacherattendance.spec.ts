import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Teacherattendance } from './teacherattendance';

describe('Teacherattendance', () => {
  let component: Teacherattendance;
  let fixture: ComponentFixture<Teacherattendance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Teacherattendance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Teacherattendance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
