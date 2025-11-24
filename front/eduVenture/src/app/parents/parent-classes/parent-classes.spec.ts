import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentClasses } from './parent-classes';

describe('ParentClasses', () => {
  let component: ParentClasses;
  let fixture: ComponentFixture<ParentClasses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParentClasses]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParentClasses);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
