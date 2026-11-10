import { TestBed } from '@angular/core/testing';

import { PanelControlService } from './panel-control.service';

describe('PanelControlService', () => {
  let service: PanelControlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PanelControlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
