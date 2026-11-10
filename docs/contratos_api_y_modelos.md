# Contratos de API y Modelos de Dominio Compartidos
## Frontend (Angular 19) ↔ Backend (Spring Boot 3 + SQL Server)

> **Documento de Integración:** Especificación de DTOs, Enums y contratos JSON que ambos equipos deben utilizar de forma idéntica para evitar discrepancias.

---

## 1. Modelos de Dominio y Enums Comunes

Los siguientes enumerados deben coincidir exactamente entre las clases Java del Backend y los tipos TypeScript del Frontend:

### 1.1 Roles de Usuario (`Rol`)
```typescript
// Frontend: nucleo/modelos/rol.enum.ts | Backend: entities/Rol.java
export enum Rol {
  USUARIO_FINAL = 'USUARIO_FINAL',
  PRACTICANTE = 'PRACTICANTE',
  ADMINISTRADOR = 'ADMINISTRADOR'
}
```

### 1.2 Prioridad Hospitalaria (`Prioridad`)
```typescript
// Frontend: compartido/modelos/prioridad.enum.ts | Backend: entities/Prioridad.java
export enum Prioridad {
  P1_CRITICA = 'P1_CRITICA',
  P2_ALTA = 'P2_ALTA',
  P3_MEDIA = 'P3_MEDIA',
  P4_BAJA = 'P4_BAJA'
}
```

### 1.3 Impacto y Urgencia (`Impacto`, `Urgencia`)
```typescript
export enum Impacto {
  ALTO = 'ALTO',     // Afecta área crítica 24/7 (Emergencia, SIS, Admisión)
  MEDIO = 'MEDIO',   // Afecta un servicio o pabellón
  BAJO = 'BAJO'      // Afecta a un solo usuario
}

export enum Urgencia {
  ALTA = 'ALTA',     // Paralización inmediata de atención médica
  MEDIA = 'MEDIA',   // Operación con lentitud o alternativa provisional
  BAJA = 'BAJA'      // No afecta la atención inmediata
}
```

### 1.4 Estados del Ticket (`EstadoTicket`)
```typescript
export enum EstadoTicket {
  NUEVO = 'NUEVO',
  ASIGNADO = 'ASIGNADO',
  EN_ATENCION = 'EN_ATENCION',
  PENDIENTE_REPUESTO = 'PENDIENTE_REPUESTO',
  RESUELTO = 'RESUELTO',
  CERRADO = 'CERRADO'
}
```

### 1.5 Estados de SLA (`EstadoSLA`)
```typescript
export enum EstadoSLA {
  A_TIEMPO = 'A_TIEMPO',
  ALERTA = 'ALERTA',
  INCUMPLIDO = 'INCUMPLIDO'
}
```

---

## 2. Contratos de Endpoints de la FASE 2

### 2.1 Contexto de Red del Cliente (Molécula `contexto-equipo`)
* **Endpoint:** `GET /api/tickets/contexto-cliente`
* **Cabecera obligatoria:** `Authorization: Bearer <token_jwt>`
* **Lógica Backend:** Lee `HttpServletRequest.getRemoteAddr()`, busca en `DIRECCION_IP` y `HISTORIAL_ASIGNACION_IP`, y devuelve la información del equipo y sala.
* **Respuesta Exitosa (200 OK):**
```json
{
  "ipDetectada": "192.168.10.45",
  "hostname": "PC-ADMIS-03",
  "areaId": 2,
  "areaNombre": "Admisión y Archivo Clínico",
  "anexoTelefonico": "2403",
  "equipoId": 14,
  "tipoEquipo": "CPU_ESCRITORIO",
  "esIpRegistrada": true
}
```
* **Respuesta de Fallback (IP Desconocida - 200 OK):**
```json
{
  "ipDetectada": "192.168.99.120",
  "hostname": null,
  "areaId": null,
  "areaNombre": null,
  "anexoTelefonico": null,
  "equipoId": null,
  "tipoEquipo": null,
  "esIpRegistrada": false
}
```

---

### 2.2 Creación de Ticket de Soporte (`solicitud-formulario`)
* **Endpoint:** `POST /api/tickets`
* **Cabecera obligatoria:** `Authorization: Bearer <token_jwt>`
* **Cuerpo de Petición (Request JSON):**
```json
{
  "tipoTicket": "INCIDENTE",
  "categoria": "SISTEMAS_HOSPITALARIOS",
  "titulo": "Sistema GALENHOS se cierra al guardar historia clínica en triaje",
  "descripcion": "Al presionar el botón guardar en la estación de triaje de Emergencia, el sistema emite un error de memoria y se cierra.",
  "impacto": "ALTO",
  "urgencia": "ALTA",
  "areaId": 1,
  "equipoId": 14,
  "ipOrigen": "192.168.10.45"
}
```
* **Respuesta Exitosa (201 Created):**
```json
{
  "id": 108,
  "codigo": "INC-2026-0108",
  "tipoTicket": "INCIDENTE",
  "titulo": "Sistema GALENHOS se cierra al guardar historia clínica en triaje",
  "prioridad": "P1_CRITICA",
  "estado": "NUEVO",
  "estadoSla": "A_TIEMPO",
  "fechaCreacion": "2026-11-10T09:30:00",
  "fechaLimiteRespuesta": "2026-11-10T09:45:00",
  "fechaLimiteResolucion": "2026-11-10T11:30:00",
  "usuarioReporta": {
    "id": 5,
    "nombreCompleto": "Dra. Patricia Huamán",
    "correo": "phuaman@minsa.gob.pe"
  },
  "area": {
    "id": 1,
    "nombre": "Emergencia Adultos"
  }
}
```

---

### 2.3 Manejo Consistente de Errores (JSON Estándar)
Ante cualquier error (validación `@Valid`, autenticación o recurso no encontrado), el backend devuelve siempre:
```json
{
  "timestamp": "2026-11-10T09:30:00",
  "status": 400,
  "error": "Bad Request",
  "mensaje": "La descripción del incidente debe contener al menos 15 caracteres",
  "ruta": "/api/tickets",
  "erroresValidacion": [
    {
      "campo": "descripcion",
      "mensaje": "La descripción debe tener entre 15 y 2000 caracteres"
    }
  ]
}
```
