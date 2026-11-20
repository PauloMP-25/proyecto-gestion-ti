# Resumen Ejecutivo de Arquitectura y Seguridad — Fase 0
**Proyecto:** Mesa de Ayuda / Service Desk Hospitalario (HSMSI)  
**Alcance:** Blindaje de Seguridad, Desacoplamiento y Andamiaje Arquitectónico  

---

## 1. Propósito y Enfoque de la Fase

La **Fase 0** tuvo como objetivo principal establecer los cimientos de seguridad, mantenibilidad y rendimiento del sistema antes de incorporar nuevas capacidades operativas. Se erradicaron vulnerabilidades críticas de exposición de datos y suplantación de identidad en red, y se reestructuró la arquitectura de backend bajo estándares empresariales para garantizar alta escalabilidad, bajo acoplamiento y resiliencia en un entorno asistencial de misión crítica.

---

## 2. Principios SOLID Aplicados

### S — Responsabilidad Única (*Single Responsibility Principle*)
- **Aislamiento de la capa Web frente a la Lógica de Negocio:** Los controladores fueron despojados de cualquier tarea de acceso directo a base de datos, toma de decisiones de autenticación o armado manual de respuestas HTTP con capturas de errores genéricas. Cada componente tiene ahora un único motivo de cambio: el controlador atiende el protocolo HTTP y los servicios gobiernan las reglas hospitalarias.
- **Segregación de utilitarios transversales:** El cálculo de tiempo y ciclo de vida de los compromisos de atención (SLA), la resolución segura de direcciones IP y la captura de errores fueron delegados a componentes especializados de infraestructura en lugar de coexistir dispersos en los servicios.

### O — Abierto / Cerrado (*Open/Closed Principle*)
- **Jerarquía de Excepciones de Dominio:** Se sustituyó el lanzamiento de excepciones genéricas de infraestructura web por excepciones semánticas de negocio (recursos no encontrados, conflictos de unicidad, reglas operativas no cumplidas, credenciales no válidas). Si el dominio hospitalario requiere nuevas reglas, el sistema se extiende con nuevas excepciones sin alterar el manejador global.
- **Estrategia Extensible de Red:** La detección de direcciones IP de origen se estructuró de manera que pueda adaptarse a diferentes topologías de red hospitalaria (acceso directo en subred local o detrás de balanceadores/proxies inspeccionados) sin modificar los controladores que consumen la IP.

### L — Sustitución de Liskov (*Liskov Substitution Principle*)
- **Contratos Consistentes en Servicios:** Todas las implementaciones de negocio respetan rigurosamente las firmas de sus interfaces, garantizando que cualquier servicio pueda ser sustituido por una versión simulada (*mock*) o una variante transaccional sin provocar comportamientos inesperados ni romper las pruebas unitarias.

### I — Segregación de Interfaces (*Interface Segregation Principle*)
- **Contratos Específicos por Dominio:** Los controladores no dependen de interfaces monolíticas o pesadas. Cada dominio funcional cuenta con contratos enfocados exclusivamente en las operaciones requeridas por su contexto (autenticación y sesión, emisión de solicitudes, administración de personal, control de equipamiento y conectividad).

### D — Inversión de Dependencias (*Dependency Inversion Principle*)
- **Desacoplamiento Total hacia Abstracciones:** La capa de presentación (controladores REST) depende exclusivamente de interfaces de servicio, nunca de clases concretas ni de repositorios de datos directos.
- **Inyección por Constructor:** Se eliminó la inyección por atributos ocultos, asegurando inmutabilidad, facilidad de pruebas unitarias aisladas y ciclos de vida estrictamente gestionados por el contenedor de inversión de control.

---

## 3. Patrones de Diseño Integrados

1. **Patrón DTO Inmutable (*Data Transfer Object* con Java Records):**
   - Garantiza que las entidades de base de datos nunca se expongan al exterior, previniendo ataques de asignación masiva (*mass assignment*). Los objetos de transferencia son estructuras inmutables con validación estricta de entrada.
2. **Patrón Mapper (*Data Mapper*):**
   - Transforma de manera pura y predecible las entidades JPA hacia representaciones seguras para el cliente, eliminando del flujo de respuesta atributos sensibles (como hashes de contraseñas o metadatos de auditoría interna).
3. **Patrón *Controller Advice* / Interceptor Global de Excepciones:**
   - Centraliza el tratamiento de contingencias y errores funcionales en un único punto del sistema. Evita la fuga de trazas internas (*stack traces*) al usuario final y normaliza el formato de respuesta de error para toda la aplicación.
4. **Patrón *Strategy* (Estrategias de Resolución de Red y Seguridad):**
   - Separa la lógica de obtención y sanitización de direcciones IP del resto de las transacciones, aislando la complejidad de formatos IPv4/IPv6 y cabeceras de reenvío.
5. **Patrón *Paging & Virtual Scrolling Support* (Paginación Pura):**
   - Provee una envoltura genérica de datos paginados que permite la carga bajo demanda (*lazy loading*), transmitiendo únicamente los registros requeridos para la vista del usuario en lugar de volcados completos de la base de datos.

---

## 4. Estrategias de Backend y Blindaje de Seguridad

1. **Defensa en Profundidad contra Fuga de Credenciales:**
   - Se configuró la exclusión estricta de credenciales en los serializadores y se adoptó el estándar de DTOs seguros, garantizando que ningún listado o consulta devuelva información confidencial de acceso.
2. **Neutralización de Suplantación de Identidad por Red (*Anti-IP Spoofing*):**
   - En una infraestructura con direccionamiento estático por puntos de atención, permitir cabeceras arbitrarias de reenvío permitiría que un atacante simule estar operando desde una computadora de Admisión o Emergencia. La estrategia implementada prioriza la dirección remota física validada y descarta orígenes no autorizados.
3. **Mecanismo Criptográfico para Accesos Iniciales y Renovación:**
   - Se eliminaron contraseñas estáticas o predecibles en el código fuente. Las claves temporales se generan con entropía criptográfica de un solo uso, y las actualizaciones de acceso exigen verificación obligatoria de la contraseña previa bajo sesión autenticada.
4. **Control de Acceso Basado en Roles a Nivel de Método (*RBAC*):**
   - Se activó la validación estricta de privilegios de forma declarativa, blindando los recursos de administración únicamente para usuarios autorizados y cerrando la creación anónima de solicitudes.
5. **Paginación Dinámica para Optimización de Red y Memoria:**
   - Se habilitó la segmentación de datos con conteos totales, páginas calculadas y ordenamiento temporal configurable, alineando el backend directamente con la experiencia de usuario reactiva en el cliente hospitalario.
6. **Desacoplamiento Temporal para Auditoría y SLAs:**
   - Se configuró un componente de reloj del sistema inyectable, facilitando la simulación determinista de tiempos límite y vencimientos en pruebas de estrés y monitoreo de compromisos de atención.

---

## 5. Estado de Verificación de la Fase

| Criterio | Estado | Resultado |
|---|:---:|---|
| Compilación y pruebas unitarias de backend | APROBADO | 17/17 pruebas superadas sin fallos (`BUILD SUCCESS`) |
| Generación de paquete de frontend | APROBADO | Compilación limpia de producción (`ng build`) |
| Auditoría de vocabulario hospitalario e iconos | APROBADO | Cero referencias prohibidas a terminología no asistencial |
| Verificación de estilos y diseño | APROBADO | Cumplimiento del sistema de tokens corporativos |
