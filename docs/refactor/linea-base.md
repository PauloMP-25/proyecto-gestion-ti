# Línea Base de Pruebas, Bundle y Arquitectura Frontend

**Proyecto:** Mesa de Ayuda — Hospital Santa María del Socorro (HSMSI)  
**Fecha:** 12 de noviembre de 2026  
**Rama Base:** `develop`  
**Rama de Trabajo:** `refactor/design-system-atomico`  
**Commit Base:** `62dabdf01ac2bb88581002f44178c2bd25c48093`  

---

## 1. Pruebas Unitarias (Línea Base)
- **Framework:** Vitest 4.0.8 / Angular CLI 22.0.0
- **Suites de prueba:** 63 archivos ejecutados (63 pasados, 0 fallidos)
- **Total de pruebas:** 302 pruebas unitarias (302 pasadas, 0 fallidas)
- **Duración típica:** ~16.25 s
- **Estado:** ✅ 100% Verde

---

## 2. Compilación y Tamaños de Bundle (`ng build`)
- **Estado de compilación:** ✅ Exitosa (código 0, sin advertencias de presupuesto de bundle)
- **Initial Total:** 376.21 kB (Raw) / 101.90 kB (Transfer)
  - `styles-HGWTILQP.css`: 7.83 kB (Raw) / 1.63 kB (Transfer)
  - `main-6M7F6PQ6.js`: 79.64 kB (Raw) / 19.57 kB (Transfer)
  - Chunks iniciales: 169.88 kB (`chunk-C-XkSk2U.js`), 98.50 kB (`chunk-CXh42dFb.js`), 20.36 kB (`chunk-DbdI0AFZ.js`)
- **Lazy Chunks (muestra principal):**
  - `panel-control-routes`: 288.95 kB (Raw) / 78.30 kB (Transfer)
  - `cmdb-lista-component`: 78.05 kB (Raw) / 15.78 kB (Transfer)
  - `bandeja-turno-page`: 47.88 kB (Raw) / 9.84 kB (Transfer)
  - `solicitud-detalle-page`: 43.90 kB (Raw) / 9.39 kB (Transfer)
  - `incidente-detalle-component`: 35.68 kB (Raw) / 7.13 kB (Transfer)
  - `ficha-atencion-page`: 33.66 kB (Raw) / 7.46 kB (Transfer)
  - `incidentes-criticos-component`: 31.56 kB (Raw) / 7.11 kB (Transfer)

---

## 3. Capturas de Referencia Previas a la Refactorización
Ubicación planificada: `docs/refactor/capturas-antes/`
Viewports de referencia:
- Desktop: 1440 × 900 px
- Tablet: 820 × 1180 px
- Móvil: 360 × 800 px

Pantallas clave:
1. Login (`/login`)
2. Portal Asistencial (`/portal`)
3. Mis Solicitudes (`/portal/mis-solicitudes`)
4. Bandeja del Turno (`/mi-turno`)
5. Ficha de Atención (`/mi-turno/ticket/:id`)
6. Panel de Control / Dashboard (`/panel-control`)
7. Gestión de Activos CMDB (`/cmdb/activos`)
