# Cuentas y Credenciales de Prueba — Mesa de Ayuda HSMSI
**Hospital Santa María del Socorro - Ica (HSMSI)**

Este documento contiene la lista oficial de cuentas activas en la base de datos SQL Server (`db_servicedesk`) para realizar pruebas cruzadas entre el personal asistencial y el equipo de soporte técnico.

---

## 🔑 Resumen de Contraseñas por Perfil

| Perfil / Rol | Contraseña Única | Ámbito de Acción |
| :--- | :---: | :--- |
| **Administrador / Ingeniero TI** | `admin123` | Control total, asignación, escalamiento, SLA y métricas de gestión |
| **Practicante de Soporte TI** | `practicante123` | Atención operativa de tickets, préstamos y diagnóstico técnico |
| **Personal Asistencial / Administrativo** | `hospital123` | Portal asistencial, reporte rápido de tickets y seguimiento de solicitudes |

---

## 🧪 Guía Rápida de Prueba Cruzada (2 Navegadores)

1. **Navegador A (Ventana Normal):**
   * Ingresa a: `http://localhost:4200/auth/login`
   * Inicia sesión como personal asistencial (Ej: usuario `dr.emergencia` / contraseña `hospital123`).
   * Dirígete a **Nueva Solicitud** (`/solicitudes/nuevo`) y reporta una falla (ej: *"Impresora térmica de recetas trabada"*).

2. **Navegador B (Ventana de Incógnito):**
   * Ingresa a: `http://localhost:4200/auth/login`
   * Inicia sesión como administrador TI (usuario `admin` / contraseña `admin123`).
   * Abre el **Panel de Control** (`/panel-control`) y el módulo de **Gestión de Solicitudes** (`/incidentes`).
   * Verifica cómo el ticket recién registrado se renderiza de inmediato en la lista, con el área asignada, el compromiso de atención (SLA) y en las métricas del dashboard.

---

## 📋 Tabla Maestra de Cuentas

### 1. Equipo de Informática y Soporte Técnico (Piso 2)

| Usuario | Contraseña | Rol en Sistema | Nombre Completo | Cargo / Función | Área Asignada |
| :--- | :---: | :---: | :--- | :--- | :--- |
| `admin` | `admin123` | `ADMINISTRADOR` | Paulo Mendoza Pérez | Coordinador de TI | Tecnología de la Información |
| `ing.fabrizio` | `admin123` | `ADMINISTRADOR` | Fabrizio Ramos Silva | Ingeniero de Sistemas | Tecnología de la Información |
| `practicante` | `practicante123` | `PRACTICANTE` | Carlos Huamán Soto | Practicante Soporte (Mañana) | Tecnología de la Información |
| `practicante2` | `practicante123` | `PRACTICANTE` | Luis Alva Vega | Practicante Soporte (Tarde) | Tecnología de la Información |

---

### 2. Personal Asistencial — Piso 1 (Emergencia, Admisión y Servicios Críticos)

| Usuario | Contraseña | Rol | Nombre Completo | Área Hospitalaria | Piso | Criticidad |
| :--- | :---: | :---: | :--- | :--- | :---: | :---: |
| `dr.emergencia` | `hospital123` | `USUARIO_FINAL` | Dr. Marcos Quispe Gutiérrez | Emergencia Admisión | Piso 1 | **P1 (Crítica)** |
| `medico` | `hospital123` | `USUARIO_FINAL` | Dra. Rosa Mendoza Quispe | Emergencia Admisión | Piso 1 | **P1 (Crítica)** |
| `lic.triaje.emg` | `hospital123` | `USUARIO_FINAL` | Lic. Carmen Torres Morales | Triaje Emergencia | Piso 1 | **P1 (Crítica)** |
| `farm.emergencia` | `hospital123` | `USUARIO_FINAL` | Q.F. José Díaz Peña | Farmacia Emergencia | Piso 1 | **P1 (Crítica)** |
| `sis.emergencia` | `hospital123` | `USUARIO_FINAL` | Srta. Elena Ramos Benavides | SIS Emergencia | Piso 1 | **P1 (Crítica)** |
| `dra.pediatria` | `hospital123` | `USUARIO_FINAL` | Dra. Ana Flores Córdova | Pediatría | Piso 1 | P2 (Alta) |
| `obst.materno` | `hospital123` | `USUARIO_FINAL` | Obst. Juana Pérez Rojas | Materno 1 | Piso 1 | **P1 (Crítica)** |
| `dr.medicina1` | `hospital123` | `USUARIO_FINAL` | Dr. Roberto Sánchez Luján | Medicina 1 | Piso 1 | P2 (Alta) |
| `dr.traumato` | `hospital123` | `USUARIO_FINAL` | Dr. Walter Cueva Meza | Traumatología | Piso 1 | P2 (Alta) |
| `lic.admision` | `hospital123` | `USUARIO_FINAL` | Sra. Patricia Gómez Castro | Admisión Central y Triaje | Piso 1 | P2 (Alta) |
| `qf.farmacia.cen` | `hospital123` | `USUARIO_FINAL` | Q.F. Manuel Castro Vilca | Farmacia Central | Piso 1 | P2 (Alta) |
| `lic.laboratorio` | `hospital123` | `USUARIO_FINAL` | Lic. Javier Ortiz Palomino | Laboratorio Clínico y Banco de Sangre | Piso 1 | P2 (Alta) |
| `cajera.central` | `hospital123` | `USUARIO_FINAL` | Srta. Mónica Vega Ríos | Caja | Piso 1 | P3 (Media) |

---

### 3. Personal Asistencial — Piso 2 (Consultorios Externos y Especialidades)

| Usuario | Contraseña | Rol | Nombre Completo | Área Hospitalaria | Piso | Criticidad |
| :--- | :---: | :---: | :--- | :--- | :---: | :---: |
| `lic.triaje.p2` | `hospital123` | `USUARIO_FINAL` | Lic. Gloria Solís Napa | Triaje Principal | Piso 2 | **P1 (Crítica)** |
| `dr.cardiologia` | `hospital123` | `USUARIO_FINAL` | Dr. Alberto Zevallos Ramos | Cardiología | Piso 2 | **P1 (Crítica)** |
| `cd.dental` | `hospital123` | `USUARIO_FINAL` | C.D. Raúl Palacios Barrientos | Dental Adultos | Piso 2 | P3 (Media) |
| `dr.quirofano` | `hospital123` | `USUARIO_FINAL` | Dr. Gabriel Morales Chauca | Centro Quirúrgico | Piso 2 | **P1 (Crítica)** |
| `mesa.partes` | `hospital123` | `USUARIO_FINAL` | Sra. Rocío Huaccachi Gómez | Mesa de Partes | Piso 2 | P3 (Media) |

---

### 4. Personal Administrativo y Jefaturas — Piso 4

| Usuario | Contraseña | Rol | Nombre Completo | Área Hospitalaria | Piso | Criticidad |
| :--- | :---: | :---: | :--- | :--- | :---: | :---: |
| `dir.ejecutiva` | `hospital123` | `USUARIO_FINAL` | Dr. Jorge Huamán Guillén | Dirección Ejecutiva | Piso 4 | P4 (Baja) |
| `adm.hospital` | `hospital123` | `USUARIO_FINAL` | Lic. Claudia Villanueva Paz | Oficina de Administración | Piso 4 | P4 (Baja) |
| `jefe.logistica` | `hospital123` | `USUARIO_FINAL` | Lic. Daniel Castillo Prado | Logística y Abastecimiento | Piso 4 | P4 (Baja) |

---

*Base de datos: SQL Server (`db_servicedesk`). Todas las contraseñas están almacenadas como hash BCrypt válido.*
