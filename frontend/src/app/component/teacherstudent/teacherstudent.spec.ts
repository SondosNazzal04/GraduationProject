import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Teacherstudent } from './teacherstudent';

describe('Teacherstudent', () => {
  let component: Teacherstudent;
  let fixture: ComponentFixture<Teacherstudent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Teacherstudent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Teacherstudent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
