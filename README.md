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
4. `npm run stack:up`
5. `npm run stack:down`
6. `npm run stack:health`

## Levantar Todo En Un Comando

Si quieres clonar y solo levantar todo (front + auth + facturacion), usa el stack script de este repo.

1. Copia configuracion base:

```bash
cp .env.stack.example .env.stack
```

2. Edita `.env.stack` con las rutas locales de tus repos de auth y facturacion.

3. Levanta todo:

```bash
npm run stack:up
```

4. Valida salud:

```bash
npm run stack:health
```

5. Baja todo:

```bash
npm run stack:down
```

Notas:

1. `stack:up` levanta auth, facturacion y frontend con build.
2. El frontend queda en `http://localhost:15173`.
3. Auth API se espera en `http://localhost:18080`.
4. Invoicing API se espera en `http://localhost:8080`.

## Puertos Por Modo

| Servicio    | Docker (host port) | Local (APP_PORT) |
|-------------|-------------------|------------------|
| Frontend    | 15173             | 5173             |
| Auth API    | 18080             | 8082             |
| Invoicing   | 8080              | 8083             |

### Desarrollo local (sin Docker)

```bash
# Copia y el front apunta automaticamente a los puertos locales
cp .env.local.example .env.local
npm install
npm run dev
```

### Health check local

```bash
FRONT_PORT=5173 AUTH_PORT=8082 INVOICING_PORT=8083 npm run stack:health
```

### Health check Docker

```bash
npm run stack:health
```

## Siguiente evolucion sugerida

1. Crear un segundo modulo (`payments`) para practicar bounded contexts.
2. Introducir React Router con rutas modulares por dominio.
3. Agregar Zustand en `app/providers` para estado global de UI.
