import { TestBed } from '@angular/core/testing';

import { EscalamientoService } from './escalamiento.service';

describe('EscalamientoService', () => {
  let service: EscalamientoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EscalamientoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
