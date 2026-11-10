# Guía de Control de Versiones y Conventional Commits
*Estándar de Git para el equipo de desarrollo — Service Desk (Hospital Santa María del Socorro)*

Para mantener el orden, la trazabilidad y asegurar una integración continua limpia entre los integrantes del equipo (Frontend y Backend), seguimos este estándar obligatorio para el flujo de ramas y los mensajes de commits.

---

## 1. Estrategia de Ramas (Git Flow Simplificado)

El repositorio cuenta con dos ramas principales protegidas de las cuales **nadie debe hacer push directo** (salvo la configuración inicial o fusiones aprobadas):

* **`main`:** Es la rama de producción. Solo contiene código 100% funcional, probado, validado con la base de datos y aprobado.
* **`develop`:** Es la rama central integradora. Aquí se unen todas las nuevas características tanto del Backend como del Frontend antes de pasar a `main`.

### ¿Cómo debe trabajar cada desarrollador?
Cuando te asignen una tarea (ej. crear el endpoint de contexto cliente o la pantalla de creación de ticket), **NUNCA trabajes directamente en `develop`**. Debes crear una rama nueva basada en `develop`:

```bash
# 1. Asegurar tener lo último de develop
git checkout develop
git pull origin develop

# 2. Crear tu rama de trabajo
git checkout -b feature/nombre-de-la-funcionalidad
```

Una vez terminada tu tarea y probada localmente (compilación y tests):
```bash
# 3. Subir tu rama al repositorio remoto
git push -u origin feature/nombre-de-la-funcionalidad
```
Luego, se crea un **Pull Request (PR)** en GitHub para fusionar tu rama con `develop`.

### Prefijos de ramas permitidos:
* `feature/nombre-de-la-tarea`: Para nuevas funcionalidades o endpoints.
* `fix/nombre-del-error`: Para corrección de bugs o errores de compilación/ejecución.
* `docs/nombre-del-documento`: Para trabajo exclusivo de documentación o manuales.
* `refactor/nombre-del-modulo`: Para reestructuraciones de código sin cambio de comportamiento.

---

## 2. Conventional Commits (Mensajes de Commit)

Todos los mensajes de commit deben seguir estrictamente el formato estándar, **en español y en minúsculas** (excepto acrónimos necesarios):

```text
<tipo>(<alcance>): <descripción breve en imperativo>
```

### Tipos permitidos:
* **`feat`**: Una nueva característica o funcionalidad (ej. nuevo endpoint, nuevo componente).
* **`fix`**: Corrección de un error o bug.
* **`docs`**: Cambios exclusivos en la documentación (ej. README, especificaciones).
* **`refactor`**: Cambio en el código que no corrige un error ni añade una función, pero mejora su estructura (SOLID, DRY).
* **`test`**: Añadir pruebas unitarias/integración o corregir pruebas existentes.
* **`chore`**: Tareas rutinarias, configuración de herramientas, dependencias o `.gitignore`.
* **`style`**: Ajustes de maquetación, formato, espaciados o CSS/SCSS sin afectar la lógica.

### Ejemplos correctos:
* ✅ `feat(tickets): implementar endpoint POST para creación con captura de IP`
* ✅ `feat(solicitudes): maquetar pantalla de registro con molécula contexto-equipo`
* ✅ `fix(sla): corregir cálculo de fecha límite que ignoraba zona horaria local`
* ✅ `refactor(auth): separar la lógica de roles hospitalarios en enum de dominio`
* ✅ `docs(api): documentar contratos de endpoints de contexto cliente`
* ✅ `style(topbar): ajustar padding e isologo institucional con object-fit`
* ✅ `test(sla): añadir pruebas unitarias para matriz de impacto y urgencia`

### Ejemplos INCORRECTOS (Prohibido hacer esto):
* ❌ `subiendo cambios`
* ❌ `fix`
* ❌ `actualizado`
* ❌ `feat(Login): Terminado`

---

## 3. Consideraciones de Seguridad (No Negociable)
* **Nunca comitear credenciales:** Jamás exponer `.env`, contraseñas en texto plano ni credenciales de base de datos en los commits.
* **Archivos locales de entorno:** El archivo `backend/pom.xml` se encuentra protegido con `skip-worktree` para permitir compatibilidad local entre Java 21 y versiones del equipo sin generar conflictos.

---

## 4. Flujo Diario de Trabajo (Checklist)

1. **Al iniciar el día:**
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. **Para empezar tu tarea:**
   ```bash
   git checkout -b feature/mi-tarea-asignada
   ```
3. **Durante la tarea:** Realizar commits atómicos (pequeños y frecuentes) usando la convención requerida.
4. **Al terminar:** Verificar que compila sin errores (`./mvnw test` en backend o `ng build` en frontend), hacer push de tu rama y notificar al equipo para revisión de PR.
