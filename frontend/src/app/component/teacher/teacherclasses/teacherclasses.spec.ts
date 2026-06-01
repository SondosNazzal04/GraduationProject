import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Teacherclasses } from './teacherclasses';

describe('Teacherclasses', () => {
  let component: Teacherclasses;
  let fixture: ComponentFixture<Teacherclasses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Teacherclasses]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Teacherclasses);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
