# Invoice Kali Front

Base frontend con React + Vite + TypeScript, preparada para practicar DDD y arquitectura hexagonal sin complejidad innecesaria.

## Estructura recomendada

```text
src/
  app/
    bootstrap/      # Punto de arranque de la aplicacion
    providers/      # Composicion de providers globales
    routing/        # Contratos/rutas centralizadas
  core/
    config/         # Configuracion y constantes globales
    types/          # Tipos utilitarios compartidos
  shared/
    domain/         # Piezas de dominio cross-modulo
    application/    # Servicios/casos de uso compartidos
    infrastructure/ # Adaptadores compartidos
    ui/             # Componentes compartidos de interfaz
  modules/
    invoicing/
      domain/         # Entidades, value objects, contratos
      application/    # Casos de uso y puertos
      infrastructure/ # Implementaciones de puertos
      ui/             # Componentes y vistas del modulo
```

## Regla de dependencias (hexagonal)

1. `domain` no depende de `application`, `infrastructure` ni `ui`.
2. `application` depende de `domain`.
3. `infrastructure` implementa puertos de `application`/`domain`.
4. `ui` consume `application` y modelos de lectura.

## Aliases disponibles

1. `@/*` -> `src/*`
2. `@app/*` -> `src/app/*`
3. `@core/*` -> `src/core/*`
4. `@shared/*` -> `src/shared/*`
5. `@modules/*` -> `src/modules/*`

## Scripts

1. `npm run dev`
2. `npm run build`
3. `npm run lint`

## Siguiente evolucion sugerida

1. Crear un segundo modulo (`payments`) para practicar bounded contexts.
2. Introducir React Router con rutas modulares por dominio.
3. Agregar Zustand en `app/providers` para estado global de UI.
