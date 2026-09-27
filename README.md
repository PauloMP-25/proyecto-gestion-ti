# Service Desk - Hospital Santa María del Socorro

Proyecto Final Integrador - Gestión del Servicio TI

Este repositorio contiene el código fuente y la documentación técnica del Sistema de Service Desk basado en ITIL v4, desarrollado para el Hospital Santa María del Socorro (Ica, Perú).

## Características Principales y Decisiones Arquitectónicas
- **Creación de Tickets sin Login (Vía IP):** Los usuarios del hospital pueden reportar incidentes desde cualquier computadora sin necesidad de credenciales. El sistema intercepta la IP y utiliza la CMDB para inferir automáticamente el Equipo y el Área de origen.
- **Base de Conocimiento (KEDB):** Registro de errores conocidos y vinculación directa con tickets para acelerar la resolución de incidentes repetitivos.
- **Gestión de SLAs Automatizada:** Motor que calcula tiempos límite de respuesta y resolución en base a una matriz de Impacto x Urgencia.
- **Lógica Centralizada en Backend:** La Base de Datos (SQL Server) actúa de forma transaccional. Las reglas de negocio, matrices y diccionarios de estados residen en el código (Java Spring Boot) como `ENUM`s y Servicios, garantizando una separación estricta de responsabilidades.

## Estructura del Repositorio
- `docs/`: Documentación técnica (Reglas, Fase 1, Arquitectura, Requerimientos, Diseño de BD).
- `backend/`: Código fuente de la API REST (Java Spring Boot).
- `frontend/`: Código fuente de la interfaz de usuario (Angular).
- `.agents/`: Contexto, reglas e instrucciones para las IAs asistentes (Claude, Gemini, Antigravity).

## Stack Tecnológico
- **Backend:** Java (Spring Boot)
- **Frontend:** Angular (TypeScript) con Angular Material
- **Base de Datos:** SQL Server
- **Control de Versiones:** Git

## Equipo de Desarrollo
- Moron Poma Paulo Cesar
- Salin Fabrizio Flores Condori
- Uchuya Cosme Humberto Uchuya
- Rupay Antisana Alexis Fabiano

## Documentación Relevante
Te recomendamos leer los siguientes documentos antes de empezar a programar:
1. [Guía de Git y Commits](docs/guia_git_commits.md)
2. [Plan de Desarrollo - Fase 1](docs/fase_1.md)
3. [Diseño de la Base de Datos](docs/diseno_base_datos.md)
4. [Requerimientos del Software](docs/requerimientos.md)
