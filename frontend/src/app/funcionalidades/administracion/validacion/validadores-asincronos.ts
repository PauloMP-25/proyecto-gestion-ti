import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { EquiposApi } from '../equipos/servicios/equipos.api';

export function validadorIpDisponible(
  api: EquiposApi,
  obtenerIdEquipo?: () => number | undefined
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const valor = control.value;
    if (!valor || typeof valor !== 'string' || !valor.trim()) {
      return of(null);
    }

    const ipLimpia = valor.trim();
    // Validación de formato básica antes de llamar a la API
    const regexIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!regexIpv4.test(ipLimpia)) {
      return of({ formatoInvalido: 'Formato IPv4 inválido (ej: 192.168.10.15)' });
    }

    const idEquipo = obtenerIdEquipo ? obtenerIdEquipo() : undefined;

    return timer(400).pipe(
      switchMap(() => api.verificarDisponibilidadIp(ipLimpia, idEquipo)),
      map((res) => {
        if (!res.disponible) {
          return { ipEnUso: res.mensaje || 'La IP ya se encuentra asignada' };
        }
        return null;
      }),
      catchError(() => of(null)) // En caso de error de red, no bloquear el formulario
    );
  };
}
