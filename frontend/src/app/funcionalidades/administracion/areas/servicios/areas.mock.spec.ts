import { describe } from 'vitest';
import { AreasMock } from './areas.mock';
import { contratoAreasApi } from './areas.api.contract';

describe('AreasMock - Implementación en memoria', () => {
  contratoAreasApi(() => new AreasMock());
});
