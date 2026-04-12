import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateActivity } from './create-activity';

describe('CreateActivity', () => {
  let component: CreateActivity;
  let fixture: ComponentFixture<CreateActivity>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateActivity]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateActivity);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
