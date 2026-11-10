# Reglas de Diseño, Vocabulario y Experiencia de Usuario (UI/UX)
## Sistema: Mesa de Ayuda — Hospital Santa María del Socorro (HSMSI)

> **Documento Compartido de Alineación para Desarrolladores Frontend y Backend**  
> **Objetivo:** Garantizar coherencia absoluta entre los textos de la interfaz, los mensajes de la API y las reglas de presentación visual del hospital.  

---

## 1. Regla de Oro de Vocabulario (Cero Referencias a ITIL en Pantalla)

* **Prohibición Estricta:** Jamás exponer las siglas `"ITIL"` ni `"ITIL v4"` en componentes visibles por el usuario (cabeceras, títulos, botones, modales, tablas o correos dirigidos a médicos).
* **Justificación:** La aplicación está diseñada para más de 700 trabajadores médicos, asistenciales y administrativos del hospital. Usar lenguaje teórico genera rechazo y confusión cognitiva.
* **Mapeo de Terminología Obligatoria:**

| Término Teórico (Uso Interno de Arquitectura) | Término Oficial en Pantalla y API (Uso Público) |
|---|---|
| Service Desk ITIL v4 | **Mesa de Ayuda** (HSMSI) |
| Matriz de Prioridad ITIL | **Nivel de Prioridad de Soporte** |
| Gestión ITIL / Prácticas | **Gestión de Solicitudes y Soporte Técnico** |
| Definición de SLA ITIL | **Compromisos de Atención y Resolución (SLA)** |
| Elemento de Configuración (CI) | **Equipo / Activo Informático** |
| Base de Errores Conocidos (KEDB) | **Base de Conocimiento y Guías de Autoayuda** |

* **Isologo Institucional:** La cabecera principal (`barra-superior`) y la pantalla de Login deben mostrar unificadamente el logo oficial `assets/logo.ico` con ajuste `object-fit: contain`.

---

## 2. Paleta Cromática Institucional (Tokens SCSS)

La paleta se extrajo de la identidad del Hospital Santa María del Socorro y su arquitectura:

```scss
// Identidad Institucional
$color-primario-guinda: #701C1C; // Cabeceras principales, botones de acción primaria
$color-primario-hover:  #521414;
$color-secundario-verde: #1B5E20; // Acciones de éxito, tickets resueltos, confirmaciones
$color-beige-fachada:    #FAF6F0; // Contenedores de login y cabecera suave
$color-slate-oscuro:     #0F172A; // Tipografía principal y modo oscuro

// Neutros y Superficies
$color-bg-app:          #F8FAFC; // Fondo general del lienzo
$color-superficie-card:  #FFFFFF; // Tarjetas, modales, paneles
$color-borde-subtle:     #E2E8F0; // Divisores de tabla y bordes de input
$color-texto-muted:      #475569; // Timestamps, metadatos y etiquetas secundarias
```

---

## 3. Semántica de Estados y Semáforos de SLA

Los niveles de prioridad y los semáforos de SLA deben mantener doble codificación (color + ícono + texto) accesible (WCAG 2.1 AAA):

### Prioridades Hospitalarias
* **P1 - Crítica:** Rojo Emergencia (`#DC2626`) | Fondo: `#FEE2E2` | Texto: `#7F1D1D` | Ícono: `warning`
* **P2 - Alta:** Naranja Alerta (`#EA580C`) | Fondo: `#FFEDD5` | Texto: `#7C2D12` | Ícono: `priority_high`
* **P3 - Media:** Ámbar Precaución (`#D97706`) | Fondo: `#FEF3C7` | Texto: `#78350F` | Ícono: `schedule`
* **P4 - Baja:** Azul Informativo (`#2563EB`) | Fondo: `#DBEAFE` | Texto: `#1E3A8A` | Ícono: `info`

### Semáforo de Cumplimiento de SLA
* **A Tiempo:** Verde (`#1B5E20`) — Más del 20% del tiempo restante disponible.
* **Alerta:** Ámbar (`#D97706`) — Menos del 20% del tiempo restante (80% transcurrido).
* **Incumplido:** Rojo (`#DC2626`) — Tiempo de atención o resolución vencido.

---

## 4. Regla de Oro Front-End: Responsividad Total

* El diseño web debe ser **100% responsivo** en cualquier resolución (Desktop, Tablet y Mobile).
* Se prohíbe el desbordamiento horizontal (`overflow-x`).
* Las tablas de tickets deben adaptarse a formato de tarjetas en dispositivos móviles.
