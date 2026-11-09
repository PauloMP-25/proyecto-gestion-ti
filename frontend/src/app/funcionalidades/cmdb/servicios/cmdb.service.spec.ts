import { TestBed } from '@angular/core/testing';

import { CmdbService } from './cmdb.service';

describe('CmdbService', () => {
  let service: CmdbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CmdbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
