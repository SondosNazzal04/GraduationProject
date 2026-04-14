import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentGrades } from './parent-grades';

describe('ParentGrades', () => {
  let component: ParentGrades;
  let fixture: ComponentFixture<ParentGrades>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParentGrades]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParentGrades);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
