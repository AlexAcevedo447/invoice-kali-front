# Invoice Kali Front

Base frontend con React + Vite + TypeScript, preparada para practicar DDD y arquitectura hexagonal sin complejidad innecesaria.

## Arranque desde cero (Docker)

Requisitos: Docker (Desktop o Engine con Compose v2), Git y Node.js (solo para `npm run`).

1. Clona los repos como carpetas hermanas:

```text
kali/
├── invoice-kali-front/     (este repo)
├── kali-auth-context/
├── kali-invoice-service/
└── kali-invoice-tests/     (opcional: pruebas Cypress)
```

   Si usas otra estructura, copia `.env.stack.example` a `.env.stack` y ajusta las rutas.

2. Desde este repo:

```bash
npm run stack:up
npm run stack:health
```

`stack:up` hace, sin sobrescribir nada existente:

- crea el `.env.dev` de cada repo copiando su `.env.example` si falta (valores de desarrollo
  local coherentes: puertos, servicios, bases, issuer `http://localhost:8080`, audience `account`, JWKS y proxies;
  credenciales de ejemplo solo locales). Equivale a `cp .env.example .env.dev` en cada repo;
- genera las claves JWT de auth en `kali-auth-context/.secrets/` si no existen (servicio `jwt-keys`);
- levanta auth, facturación y front. Postgres crea cada base la primera vez; **las migraciones
  se aplican solas** al arrancar cada API;
- auth crea la **empresa de plataforma y su administrador** (`SEED_MASTER_*`, idempotente).

| Servicio | URL |
| --- | --- |
| Front | http://localhost:15173 |
| Auth API | http://localhost:18080 (salud `/health`, JWKS `/.well-known/jwks.json`) |
| Facturación API | http://localhost:8080 (métricas `/api/v1/metrics`) |
| Adminer (BD de auth) | http://localhost:18081 |

Usuario inicial (empresa `master`): `master@local.dev` / `Kali#Local2026` (valores de ejemplo de
`kali-auth-context/.env.example`, solo para uso local).

Empresa de prueba para la demo (opcional, repetible): desde `kali-invoice-tests/cypress`,
`npm ci`, exportar `CYPRESS_AUTH_ADMIN_PASSWORD` y `CYPRESS_DEMO_ADMIN_PASSWORD` (o crear
`cypress.env.json` desde `cypress.env.example.json`) y luego
`npx cypress run --spec e2e/demo/seed-video-demo.cy.ts` (o, sin Node, `docker compose run --rm cypress
--spec e2e/demo/seed-video-demo.cy.ts`; ver `kali-invoice-tests/cypress/README.md`). Crea "Empresa Demo" (código `demo`),
su administrador `admin.demo@local.dev` / `Demo#Local2026` con rol `invoicing`, clientes, productos y facturas.

## Desarrollo del front en el host

```bash
npm install
npm run setup      # crea .env.local (proxies a localhost) y .env.stack si faltan
npm run dev        # http://localhost:5173 (backends levantados con stack:up)
```

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

1. `npm run setup`     - Primer setup (crea .env.local y .env.stack)
2. `npm run dev`      - Dev local
3. `npm run build`    - Build production
4. `npm run lint`     - Lint
5. `npm run stack:up` - Levanta Docker (auth + invoicing + front)
6. `npm run stack:down` - Baja Docker
7. `npm run stack:health` - Valida salud de servicios

## Levantar Todo En Un Comando

Si quieres clonar y solo levantar todo (front + auth + facturacion), usa el stack script de este repo.

1. Rutas de los repos. Por defecto se usan repos hermanos de este
   (`../kali-auth-context` y `../kali-invoice-service`). Si los tienes en otra
   ubicación, crea `.env.stack` (ignorado por git) y ajusta las rutas; las rutas
   relativas se resuelven desde la raíz de este repo:

```bash
cp .env.stack.example .env.stack
# p. ej. INVOICING_PROJECT_PATH=../../KALI/kali-invoice-service
```

2. Cada repo usa su propio `.env.dev` (credenciales y puertos); `.env.stack` no lleva secretos.

| Pieza | Archivo Compose | Puerto en el host |
| --- | --- | --- |
| Auth (`kali-auth-context`) | `docker-compose.dev.yml` + `.env.dev` | 18080 |
| Facturación (`kali-invoice-service`) | `docker-compose.dev.yml` + `.env.dev` (o `docker-compose.debug.yml` con Delve) | 8080 (BD 5432) |
| Front (este repo) | `docker-compose.dev.yml` + `.env.dev` | 15173 |

3. Levanta todo:

```bash
npm run stack:up
```

4. Valida salud:

```bash
npm run stack:health
```

5. Baja todo (sin `-v`: conserva los volúmenes de datos):

```bash
npm run stack:down
```

`stack:health` comprueba front, auth (`/health` y JWKS), facturación (`/api/v1/metrics`),
que facturación rechace peticiones sin token (401) y que el proxy del front llegue a facturación.

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

## Guia Frontend Desde Comprimido (Local)

Esta guia es para ejecutar `invoice-kali-front.zip` en modo local (sin Docker en este repo).

1. Descomprime y entra al proyecto:

```bash
unzip invoice-kali-front.zip
cd invoice-kali-front
```

2. Instala dependencias y configura archivos locales:

```bash
npm install
npm run setup
```

3. Levanta los servicios backend en local:

1. Auth en `http://localhost:8082`
2. Facturacion en `http://localhost:8083`

4. Inicia el frontend:

```bash
npm run dev
```

5. Abre en navegador:

1. `http://localhost:5173`

Troubleshooting rapido:

1. `ENOTFOUND base.invalid`: falta `npm run setup` o no existe `.env.local`.
2. `Port 5173 is already in use`: libera ese puerto o reinicia Vite.
3. `502 Bad Gateway`: auth o facturacion no estan arriba en los puertos locales.
