import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { FormControl, FormGroup } from '@angular/forms';
import { aplicarErroresServidor } from './errores-formulario';

describe('aplicarErroresServidor', () => {
  it('debe asignar error del servidor al control correspondiente cuando viene campo y mensaje', () => {
    const form = new FormGroup({
      nombre: new FormControl('admision'),
    });

    const errorHttp = {
      status: 409,
      error: {
        codigo: 'NOMBRE_DUPLICADO',
        campo: 'nombre',
        mensaje: 'Ya existe un área con ese nombre',
      },
    };

    const mensajeGeneral = aplicarErroresServidor(form, errorHttp);

    expect(mensajeGeneral).toBe('Ya existe un área con ese nombre');
    expect(form.get('nombre')?.errors?.['servidor']).toBe('Ya existe un área con ese nombre');
    expect(form.get('nombre')?.touched).toBe(true);
  });

  it('debe manejar mapa de errores por campo', () => {
    const form = new FormGroup({
      nombre: new FormControl(''),
      anexo: new FormControl('abc'),
    });

    const errorHttp = {
      status: 400,
      error: {
        erroresPorCampo: {
          nombre: 'El nombre es obligatorio',
          anexo: 'El anexo solo admite dígitos',
        },
      },
    };

    aplicarErroresServidor(form, errorHttp);

    expect(form.get('nombre')?.errors?.['servidor']).toBe('El nombre es obligatorio');
    expect(form.get('anexo')?.errors?.['servidor']).toBe('El anexo solo admite dígitos');
  });

  it('debe devolver mensaje general de fallback si no hay campo', () => {
    const form = new FormGroup({
      nombre: new FormControl(''),
    });

    const errorHttp = {
      status: 500,
      message: 'Fallo interno del servidor',
    };

    const msj = aplicarErroresServidor(form, errorHttp);
    expect(msj).toBe('Fallo interno del servidor');
    expect(form.get('nombre')?.errors).toBeNull();
  });
});
