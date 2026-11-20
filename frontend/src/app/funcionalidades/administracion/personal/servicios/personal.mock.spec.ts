import { describe } from 'vitest';
import { PersonalMock } from './personal.mock';
import { contratoPersonalApi } from './personal.api.contract';

describe('PersonalMock - Implementación en memoria', () => {
  contratoPersonalApi(() => new PersonalMock());
});
