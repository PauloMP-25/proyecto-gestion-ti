import { contratoCambiosApi } from './cambios.api.contract';
import { CambiosMock } from './cambios.mock';

contratoCambiosApi(() => new CambiosMock());
