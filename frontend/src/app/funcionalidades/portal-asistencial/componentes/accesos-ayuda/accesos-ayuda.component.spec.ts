import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AccesosAyudaComponent } from './accesos-ayuda.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('AccesosAyudaComponent', () => {
  let component: AccesosAyudaComponent;
  let fixture: ComponentFixture<AccesosAyudaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccesosAyudaComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AccesosAyudaComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('articulos', [
      { id: 1, titulo: 'Guía GalenHos', categoriaId: 1, categoriaNombre: 'Software', sintoma: 'Error de login' },
    ]);
    fixture.detectChanges();
  });

  it('debe crearse y renderizar tarjetas de articulos y tarjeta ver todas', () => {
    expect(component).toBeTruthy();
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Guía GalenHos');
    expect(texto).toContain('Ver todas las guías');
  });
});
