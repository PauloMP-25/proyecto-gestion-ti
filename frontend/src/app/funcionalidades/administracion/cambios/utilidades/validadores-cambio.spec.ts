import {
  DatosHorario,
  evaluarContinuidad,
  evaluarHorario,
  evaluarInterrupcion,
  evaluarPlanReversa,
  reversaExcedeHorario,
  sugiereImpactoCritico,
} from './validadores-cambio';

const AHORA = Date.parse('2027-11-20T12:00:00');

function datosHorario(parcial: Partial<DatosHorario> = {}): DatosHorario {
  return {
    inicioIso: '2027-12-01T23:00',
    finIso: '2027-12-02T01:00',
    tipo: 'PROGRAMADO',
    nivel: 'BAJO',
    requiereHorario: false,
    ahoraMs: AHORA,
    ...parcial,
  };
}

describe('validadores-cambio', () => {
  describe('V4 — fin posterior al inicio', () => {
    it('rechaza un fin anterior o igual al inicio', () => {
      expect(
        evaluarHorario(datosHorario({ inicioIso: '2027-12-01T22:00', finIso: '2027-12-01T21:00' })),
      ).toEqual({ finNoPosterior: true });
      expect(
        evaluarHorario(datosHorario({ inicioIso: '2027-12-01T22:00', finIso: '2027-12-01T22:00' })),
      ).toEqual({ finNoPosterior: true });
    });

    it('acepta un fin posterior al inicio', () => {
      expect(evaluarHorario(datosHorario())).toBeNull();
    });
  });

  describe('V5 — inicio en el futuro salvo cambio urgente', () => {
    it('rechaza un inicio pasado en cambios no urgentes', () => {
      expect(
        evaluarHorario(datosHorario({ inicioIso: '2027-11-20T10:00', finIso: '2027-11-20T11:00' })),
      ).toEqual({ inicioNoFuturo: true });
    });

    it('permite un inicio pasado en cambios urgentes', () => {
      expect(
        evaluarHorario(
          datosHorario({
            inicioIso: '2027-11-20T10:00',
            finIso: '2027-11-20T11:00',
            tipo: 'URGENTE',
          }),
        ),
      ).toBeNull();
    });
  });

  describe('V6 — horario obligatorio al enviar', () => {
    it('exige horario cuando la validación lo requiere', () => {
      expect(
        evaluarHorario(datosHorario({ inicioIso: '', finIso: '', requiereHorario: true })),
      ).toEqual({ horarioRequerido: true });
    });

    it('permite guardar borrador sin horario', () => {
      expect(evaluarHorario(datosHorario({ inicioIso: '', finIso: '', requiereHorario: false }))).toBeNull();
    });
  });

  describe('V10 — horario nocturno para impacto crítico', () => {
    it('acepta inicio exactamente a las 19:00', () => {
      expect(
        evaluarHorario(
          datosHorario({
            inicioIso: '2027-12-01T19:00',
            finIso: '2027-12-02T01:00',
            nivel: 'CRITICO',
          }),
        ),
      ).toBeNull();
    });

    it('rechaza inicio a las 07:00 y a las 18:59', () => {
      expect(
        evaluarHorario(
          datosHorario({
            inicioIso: '2027-12-01T07:00',
            finIso: '2027-12-01T09:00',
            nivel: 'CRITICO',
          }),
        ),
      ).toEqual({ horarioCriticoDiurno: true });

      expect(
        evaluarHorario(
          datosHorario({
            inicioIso: '2027-12-01T18:59',
            finIso: '2027-12-01T21:00',
            nivel: 'CRITICO',
          }),
        ),
      ).toEqual({ horarioCriticoDiurno: true });
    });

    it('acepta inicio a las 06:59', () => {
      expect(
        evaluarHorario(
          datosHorario({
            inicioIso: '2027-12-01T06:59',
            finIso: '2027-12-01T08:00',
            nivel: 'CRITICO',
          }),
        ),
      ).toBeNull();
    });

    it('no restringe horario diurno en cambios urgentes ni en impacto alto', () => {
      expect(
        evaluarHorario(
          datosHorario({
            inicioIso: '2027-12-01T12:00',
            finIso: '2027-12-01T13:00',
            nivel: 'CRITICO',
            tipo: 'URGENTE',
          }),
        ),
      ).toBeNull();

      expect(
        evaluarHorario(
          datosHorario({
            inicioIso: '2027-12-01T12:00',
            finIso: '2027-12-01T13:00',
            nivel: 'ALTO',
          }),
        ),
      ).toBeNull();
    });
  });

  describe('V7 — minutos de interrupción', () => {
    it('exige minutos cuando se interrumpe el servicio', () => {
      expect(evaluarInterrupcion(true, null)).toEqual({ minutosInterrupcionRequeridos: true });
      expect(evaluarInterrupcion(true, 0)).toEqual({ minutosInterrupcionRequeridos: true });
    });

    it('acepta minutos positivos o ausencia de interrupción', () => {
      expect(evaluarInterrupcion(true, 15)).toBeNull();
      expect(evaluarInterrupcion(false, null)).toBeNull();
    });
  });

  describe('V8 — plan de reversa obligatorio', () => {
    it('rechaza planes incompletos', () => {
      expect(evaluarPlanReversa('', [{ descripcion: 'Restaurar respaldo' }], 10)).toEqual({
        planReversaIncompleto: true,
      });
      expect(evaluarPlanReversa('Si falla algo', [], 10)).toEqual({
        planReversaIncompleto: true,
      });
      expect(evaluarPlanReversa('Si falla algo', [{ descripcion: 'Restaurar respaldo' }], 0)).toEqual({
        planReversaIncompleto: true,
      });
    });

    it('acepta un plan completo', () => {
      expect(
        evaluarPlanReversa('Si falla algo', [{ descripcion: 'Restaurar respaldo' }], 10),
      ).toBeNull();
    });
  });

  describe('V9 — continuidad asistencial en impacto alto o crítico', () => {
    it('la exige en impacto alto y crítico', () => {
      expect(evaluarContinuidad('ALTO', '')).toEqual({ continuidadRequerida: true });
      expect(evaluarContinuidad('CRITICO', null)).toEqual({ continuidadRequerida: true });
    });

    it('la acepta completa o la omite en impacto bajo y medio', () => {
      expect(evaluarContinuidad('ALTO', 'Registro en formato físico')).toBeNull();
      expect(evaluarContinuidad('MEDIO', '')).toBeNull();
      expect(evaluarContinuidad('BAJO', null)).toBeNull();
    });
  });

  it('V11 — sugiere impacto crítico cuando hay áreas críticas', () => {
    expect(sugiereImpactoCritico([{ esCritica: true }], 'ALTO')).toBe(true);
    expect(sugiereImpactoCritico([{ esCritica: false }], 'ALTO')).toBe(false);
    expect(sugiereImpactoCritico([{ esCritica: true }], 'CRITICO')).toBe(false);
  });

  it('V12 — advierte cuando la reversa supera el horario', () => {
    expect(
      reversaExcedeHorario('2027-12-01T22:00', '2027-12-01T22:20', 30),
    ).toBe(true);
    expect(
      reversaExcedeHorario('2027-12-01T22:00', '2027-12-02T01:00', 25),
    ).toBe(false);
    expect(reversaExcedeHorario(null, null, 25)).toBe(false);
  });
});
