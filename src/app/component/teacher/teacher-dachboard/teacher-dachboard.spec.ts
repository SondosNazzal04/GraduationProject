import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherDachboard } from './teacher-dachboard';

describe('TeacherDachboard', () => {
  let component: TeacherDachboard;
  let fixture: ComponentFixture<TeacherDachboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherDachboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherDachboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
