import { readFileSync, globSync } from 'node:fs';

// Material Symbols permitidos
const ICONOS_VALIDOS = new Set([
  'account_tree', 'add', 'add_circle', 'add_task', 'admin_panel_settings', 'alarm',
  'analytics', 'apartment', 'archive', 'arrow_back', 'arrow_downward', 'arrow_forward', 'arrow_upward',
  'assignment', 'assignment_turned_in', 'badge', 'build', 'calendar_today',
  'call', 'cancel', 'change_circle', 'check', 'check_circle', 'chevron_left',
  'chevron_right', 'clinical_notes', 'close', 'cloud_off', 'computer', 'construction',
  'content_copy', 'dashboard', 'delete', 'description', 'desktop_windows',
  'devices', 'dns', 'domain', 'drag_indicator', 'ecg_heart', 'edit',
  'edit_note', 'emergency', 'engineering', 'error', 'error_outline',
  'escalator_warning', 'event_upcoming', 'expand_less', 'expand_more', 'fact_check', 'favorite',
  'fiber_manual_record', 'filter_alt_off', 'filter_list', 'fingerprint', 'format_list_numbered',
  'gavel', 'grid_on', 'groups', 'headset_mic', 'help', 'help_outline',
  'history', 'home', 'hourglass_empty', 'hub', 'inbox', 'info',
  'inventory_2', 'keyboard_arrow_down', 'keyboard_arrow_up', 'label', 'lan',
  'lightbulb', 'link', 'live_help', 'local_hospital', 'location_on', 'lock',
  'lock_person', 'login', 'logout', 'manage_accounts', 'menu', 'menu_book',
  'monitor', 'monitor_heart', 'notification_important', 'pan_tool', 'pause',
  'person', 'person_add', 'person_off', 'phone', 'play_arrow', 'policy',
  'preview', 'print', 'psychology', 'public', 'publish', 'receipt_long', 'refresh',
  'report_problem', 'restart_alt', 'router', 'save', 'schedule', 'search',
  'search_off', 'security', 'send', 'settings', 'shield', 'star',
  'star_border', 'storage', 'support_agent', 'swap_horiz', 'sync', 'sync_alt',
  'task', 'task_alt', 'thumb_up', 'timer', 'timer_off', 'touch_app', 'track_changes',
  'trending_up', 'unpublished', 'verified', 'visibility', 'visibility_off',
  'warning', 'wifi', 'wifi_off'
]);

// Aliases legados (estilo Feather/Lucide) soportados por app-icono
const ALIASES_LEGADOS = {
  'arrow-left': 'arrow_back',
  'arrow_left': 'arrow_back',
  'arrow-right': 'arrow_forward',
  'arrow_right': 'arrow_forward',
  'arrow-up': 'arrow_upward',
  'arrow-down': 'arrow_downward',
  'chevron-right': 'chevron_right',
  'chevron-left': 'chevron_left',
  'chevron-down': 'keyboard_arrow_down',
  'chevron-up': 'keyboard_arrow_up',
  'alert-circle': 'error',
  'alert-triangle': 'warning',
  'check-circle': 'check_circle',
  'x-circle': 'cancel',
  'info-circle': 'info',
  'help-circle': 'help',
  'plus-circle': 'add_circle',
  'plus': 'add',
  'x': 'close',
  'cross': 'close',
  'trash': 'delete',
  'edit-2': 'edit',
  'edit-3': 'edit',
  'refresh-cw': 'refresh',
  'printer': 'print',
  'monitor': 'desktop_windows',
  'shield': 'shield',
  'map-pin': 'location_on',
  'user': 'person',
  'users': 'groups',
  'tag': 'description',
  'calendar': 'calendar_today',
  'clock': 'schedule',
  'heart': 'favorite',
};

const archivos = globSync('src/**/*.html');
let errores = 0;

for (const f of archivos) {
  const content = readFileSync(f, 'utf8');
  const matches = content.matchAll(/<app-icono[^>]*?(?:nombre=["']([^"']+)["']|\[nombre\]=["']'([^"']+)'["'])/g);
  for (const m of matches) {
    const rawName = m[1] || m[2];
    const norm = ALIASES_LEGADOS[rawName] || rawName.replace(/-/g, '_');
    if (!ICONOS_VALIDOS.has(norm)) {
      console.error(`✖ ${f}: Ícono no reconocido "${rawName}" (normalizado: "${norm}")`);
      errores++;
    }
  }
}

if (errores === 0) {
  console.log('✔ Verificación de íconos: Todos los íconos utilizados son válidos o poseen alias admitido.');
}

process.exit(errores ? 1 : 0);
