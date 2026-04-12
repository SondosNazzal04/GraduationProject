import { TestBed } from '@angular/core/testing';

import { Activityi } from './activityi';

describe('Activityi', () => {
  let service: Activityi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Activityi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
