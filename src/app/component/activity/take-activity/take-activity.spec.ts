import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TakeActivity } from './take-activity';

describe('TakeActivity', () => {
  let component: TakeActivity;
  let fixture: ComponentFixture<TakeActivity>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TakeActivity]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TakeActivity);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
