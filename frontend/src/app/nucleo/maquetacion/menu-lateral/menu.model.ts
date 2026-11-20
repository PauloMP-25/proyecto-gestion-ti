import { TipoBadgeNav } from '../../../compartido/ui/moleculas/item-nav/item-nav.component';

export interface ItemMenu {
  titulo: string;
  ruta: string;
  icono: string;
  badge?: string | number;
  badgeTipo?: TipoBadgeNav;
  exacto?: boolean;
}

export interface SeccionMenu {
  encabezado?: string;
  items: readonly ItemMenu[];
}
