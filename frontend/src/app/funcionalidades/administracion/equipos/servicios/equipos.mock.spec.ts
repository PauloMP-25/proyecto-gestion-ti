import { describe } from 'vitest';
import { EquiposMock } from './equipos.mock';
import { contratoEquiposApi } from './equipos.api.contract';

describe('EquiposMock - Implementación en memoria', () => {
  contratoEquiposApi(() => new EquiposMock());
});
