import { TestBed } from '@angular/core/testing';

import { BaseConocimientoService } from './base-conocimiento.service';

describe('BaseConocimientoService', () => {
  let service: BaseConocimientoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BaseConocimientoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
