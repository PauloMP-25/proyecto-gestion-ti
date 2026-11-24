import { contratoConocimientoApi } from './conocimiento.api.contract';
import { ConocimientoMock } from './conocimiento.mock';

contratoConocimientoApi(() => new ConocimientoMock());
