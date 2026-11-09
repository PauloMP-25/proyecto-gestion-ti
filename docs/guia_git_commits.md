# Guía de Git y Commits

## Convenciones de Commits
Se utilizará el formato de **Conventional Commits**:

`<tipo>(<módulo>): <descripción corta en español, imperativo>`

### Ejemplos:
- `feat(incidentes): agregar endpoint de creación de ticket`
- `fix(sla): corregir cálculo de tiempo restante`
- `refactor(auth): mover lógica de roles a middleware`

### Tipos Permitidos:
- **feat**: Una nueva característica.
- **fix**: Corrección de un error.
- **refactor**: Cambio de código que no corrige un error ni añade una característica.
- **docs**: Cambios solo en la documentación.
- **test**: Añadir o corregir pruebas existentes.
- **chore**: Cambios en el proceso de construcción o herramientas auxiliares.
- **style**: Cambios que no afectan el significado del código (espacios, formato, etc.).

## Consideraciones de Seguridad
- Nunca exponer `.env`, `application.properties` ni credenciales en commits.
