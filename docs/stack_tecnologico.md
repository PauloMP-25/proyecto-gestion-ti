# Stack Tecnológico

El proyecto sigue una arquitectura de N-Capas con las siguientes tecnologías:

## Backend
- **Lenguaje / Framework:** Java con Spring Boot.
- **Responsabilidad:** Toda la lógica de negocio (matriz de prioridades, reglas de SLA, transiciones de estado) reside aquí, estructurada en la capa de Servicios. Los Controladores solo manejan enrutamiento y validación inicial de entrada.
- **Seguridad:** Middleware/Filtros para autenticación y autorización obligatoria de todas las rutas.
- **Manejo de Errores:** Se devuelven respuestas JSON estructuradas limpias al frontend.

## Frontend
- **Framework:** Angular (TypeScript).
- **Componentes:** Angular Material.
- **Responsabilidad:** Interfaz de usuario dinámica e interactiva. Todo dato ingresado debe ser validado por UX, pero respaldado por validación estricta en el Backend.

## Base de Datos
- **Motor:** SQL Server.
- **Responsabilidad:** Almacenamiento puramente transaccional. La base de datos no contiene lógica de negocio en tablas maestras. Tablas de catálogos se manejan vía ENUMs en el Backend, y la BD almacena los VARCHAR resultantes.

## Control de Versiones y Prácticas
- **Control de Versiones:** Git.
- **Pruebas:** Pruebas unitarias y de integración para asegurar reglas críticas (ej. motores de SLA y escalamientos).
