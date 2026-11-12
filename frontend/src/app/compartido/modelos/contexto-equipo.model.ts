export interface ContextoEquipo {
  id?: number | null;
  hostname?: string | null;
  ip: string;
  tipo?: string | null;
  areaId?: number;
  area?: string;
  anexo?: string | null;
  ipRegistrada?: boolean;
}
