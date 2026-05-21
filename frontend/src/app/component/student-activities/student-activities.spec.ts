import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentActivities } from './student-activities';

describe('StudentActivities', () => {
  let component: StudentActivities;
  let fixture: ComponentFixture<StudentActivities>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentActivities]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentActivities);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
