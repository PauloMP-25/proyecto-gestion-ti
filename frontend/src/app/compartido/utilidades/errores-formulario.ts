import { FormGroup } from '@angular/forms';

export interface ErrorHttpBackend {
  status?: number;
  error?: {
    codigo?: string;
    mensaje?: string;
    campo?: string;
    erroresPorCampo?: Record<string, string>;
    errores?: Array<{ campo: string; mensaje: string }>;
    detalles?: string | Record<string, string>;
  };
  message?: string;
}

/**
 * Utilidad pura para mapear errores HTTP (400 Bad Request, 409 Conflict, 422 Unprocessable Entity)
 * a los controles de un formulario reactivo o retornar un mensaje general.
 */
export function aplicarErroresServidor(form: FormGroup, error: unknown): string | null {
  if (!error) return null;

  const httpError = error as ErrorHttpBackend;
  const payload = httpError.error;

  let mensajeGeneral: string | null = null;

  if (payload) {
    if (typeof payload === 'string') {
      return payload;
    }

    mensajeGeneral = payload.mensaje || null;

    // Caso 1: Error en un campo único (ej. 409 Conflicto { campo: "nombre", mensaje: "Ya existe un área con ese nombre" })
    if (payload.campo && payload.mensaje) {
      const control = form.get(payload.campo);
      if (control) {
        control.setErrors({ servidor: payload.mensaje });
        control.markAsTouched();
      }
    }

    // Caso 2: Mapa de errores por campo (Validation)
    if (payload.erroresPorCampo && typeof payload.erroresPorCampo === 'object') {
      for (const [campo, msj] of Object.entries(payload.erroresPorCampo)) {
        const control = form.get(campo);
        if (control) {
          control.setErrors({ servidor: msj });
          control.markAsTouched();
        }
      }
    }

    // Caso 3: Lista de errores por campo
    if (Array.isArray(payload.errores)) {
      for (const err of payload.errores) {
        if (err.campo) {
          const control = form.get(err.campo);
          if (control) {
            control.setErrors({ servidor: err.mensaje });
            control.markAsTouched();
          }
        }
      }
    }
  } else if (httpError.message) {
    mensajeGeneral = httpError.message;
  }

  return mensajeGeneral || 'Ocurrió un error al procesar la solicitud.';
}
