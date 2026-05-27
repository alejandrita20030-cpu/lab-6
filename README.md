# Branch Naming Validator - GitHub Custom Action

Esta es una Custom Action de tipo JavaScript (Node.js 20) que valida el nombre de la rama en ejecución contra una expresión regular configurable, extrae dinámicamente información de la rama (como el tipo de tarea y el ID del ticket) y expone outputs para ser consumidos por otros pasos del flujo de trabajo.

Diseñada para asegurar que el equipo siga las convenciones de nomenclatura en Git (por ejemplo: `feature/PROJ-123-new-login`).

## Características

- 🔍 **Validación Flexible:** Permite usar una expresión regular personalizada o la por defecto.
- 📦 **Cero Dependencias:** Implementada puramente en Node.js nativo (sin necesidad de hacer `npm install` o compilar dependencias).
- 🏷️ **Extracción Dinámica:** Extrae automáticamente el tipo de rama (ej. `feature`, `bugfix`) y el ID del ticket (ej. `PROJ-123`) si se usan grupos de captura en la expresión regular.
- 🛡️ **Robusta:** Manejo controlado de errores para entradas vacías o expresiones regulares mal formadas.

---

## Entradas (Inputs)

| Parámetro | Descripción | Requerido | Por Defecto |
| :--- | :--- | :---: | :--- |
| `branch-name` | El nombre de la rama que se va a validar. | No | `${{ github.head_ref \|\| github.ref_name }}` |
| `regex` | Expresión regular que debe cumplir la rama. Debe contener al menos dos grupos de captura para extraer `prefix` y `ticket-id`. | No | `^(feature\|bugfix\|hotfix\|release)\/([a-zA-Z0-9]+-[0-9]+)-.+` |
| `fail-on-error` | Determina si el paso del workflow debe fallar (`true`) o terminar con éxito reportando la invalidez (`false`) si la rama no cumple el patrón. | No | `true` |

---

## Salidas (Outputs)

| Parámetro | Descripción | Ejemplo de Salida |
| :--- | :--- | :--- |
| `is-valid` | `"true"` si el nombre de la rama cumple el patrón, o `"false"` si no. | `true` |
| `prefix` | El prefijo/tipo de rama extraído del primer grupo de captura. | `feature` |
| `ticket-id` | El identificador de ticket/tarea extraído del segundo grupo de captura. | `PROJ-123` |
| `summary` | Un resumen detallado en texto sobre el resultado de la validación. | `Validación exitosa: La rama...` |

---

## Ejemplo de Uso en Workflow

Crea un archivo `.github/workflows/validate-branch.yml` en tu repositorio y añade el siguiente contenido para validar las ramas de tus Pull Requests:

```yaml
name: Branch Name Compliance

on:
  pull_request:
    branches:
      - main
      - master
  workflow_dispatch: # Permite ejecución manual

jobs:
  validate:
    runs-on: ubuntu-latest
    name: Validar Rama
    steps:
      - name: Checkout del código
        uses: actions/checkout@v4

      - name: Ejecutar Branch Naming Validator
        id: branch_validator
        # Usando la action local o externa (ejemplo de versión estable)
        uses: TuUsuario/nombre-repo-action@v1.0.0
        with:
          branch-name: ${{ github.head_ref }}
          fail-on-error: 'false' # Permite que continúe para poder ver los outputs

      - name: Imprimir Resultados
        run: |
          echo "La rama es válida? -> ${{ steps.branch_validator.outputs.is-valid }}"
          echo "Tipo de rama:      -> ${{ steps.branch_validator.outputs.prefix }}"
          echo "ID de Ticket:      -> ${{ steps.branch_validator.outputs.ticket-id }}"
          echo "Resumen:           -> ${{ steps.branch_validator.outputs.summary }}"

      - name: Fallar si no es válida
        if: steps.branch_validator.outputs.is-valid == 'false'
        run: |
          echo "Error: La rama no cumple con el formato requerido."
          exit 1
```

---

## Estrategia de Versionado (Parte 4)

Para garantizar la estabilidad y reutilización en otros repositorios de la organización, se adopta la siguiente estrategia de versionado recomendada por GitHub:

1. **Desarrollo en `main`:** Los cambios se realizan y prueban en la rama principal.
2. **Tags de Versión Semántica:** Cada release estable se etiqueta con un tag tridimensional (ej. `v1.0.0`).
3. **Tags de Versión Mayor Flotantes:** Se crea o actualiza un tag de versión mayor (ej. `v1`) para apuntar al último commit estable de la versión 1. Esto permite a los consumidores usar `uses: TuUsuario/nombre-repo-action@v1` sin preocuparse por actualizaciones menores que no rompan compatibilidad.
4. **Releases de GitHub:** Se publica una GitHub Release asociada al tag para documentar las mejoras y facilitar el descubrimiento de la acción en el Marketplace.
