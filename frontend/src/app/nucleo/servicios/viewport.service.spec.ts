import { TestBed } from '@angular/core/testing';
import { ViewportService } from './viewport.service';

describe('ViewportService', () => {
  let service: ViewportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ViewportService],
    });
    service = TestBed.inject(ViewportService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
    expect(typeof service.esDesktop()).toBe('boolean');
    expect(typeof service.esMovil()).toBe('boolean');
  });

  it('debe permitir leer y actualizar el estado de esDesktop y esMovil', () => {
    service.esDesktop.set(false);
    service.esMovil.set(true);

    expect(service.esDesktop()).toBe(false);
    expect(service.esMovil()).toBe(true);
  });
});
