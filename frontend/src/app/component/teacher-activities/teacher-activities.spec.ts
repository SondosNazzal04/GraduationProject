import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherActivities } from './teacher-activities';

describe('TeacherActivities', () => {
  let component: TeacherActivities;
  let fixture: ComponentFixture<TeacherActivities>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherActivities]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherActivities);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
