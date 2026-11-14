# Matriz de permisos (RBAC) — InvoiceKali

Contrato compartido por `kali-auth-context`, `kali-invoice-service`, `invoice-kali-front` y
`kali-invoice-tests`. Incremento 2 (RF-06 a RF-09). Decisiones del 14 nov 2026.

## Catálogo de recursos y acciones

Basado en las operaciones existentes. Un permiso es `(recurso, acción)` por empresa. Se
guardan normalizados: sin espacios a los lados y en minúsculas.

| Recurso | Acciones | Operaciones que cubre |
| --- | --- | --- |
| `tenants` | `manage` | Administración de empresas (solo en la empresa de plataforma) |
| `users` | `read`, `manage` | Usuarios |
| `roles` | `read`, `manage` | Roles |
| `permissions` | `read`, `manage` | Permisos |
| `rbac` | `manage` | Asignaciones usuario↔rol y rol↔permiso; consultar accesos de otros usuarios |
| `invoices` | `read`, `manage` | Facturas, incluidos pagar y cancelar |
| `invoice-items` | `read`, `manage` | Líneas de factura |
| `customers` | `read`, `manage` | Catálogo de clientes |
| `products` | `read`, `manage` | Catálogo de productos |

- **Comodín `*`:** vale como recurso, como acción o ambos (`*/*` = todo). Solo se acepta un
  recurso o acción fuera del catálogo si es `*`. Si el recurso es `*`, la acción puede ser
  `*`, `read` o `manage`.
- **`manage` incluye `read`:** quien puede modificar un recurso también puede consultarlo.
- `GET /api/v1/permissions/catalog` (autenticado) devuelve este catálogo.

## Operaciones y permiso exigido

### kali-auth-context

| Operación | Permiso |
| --- | --- |
| `GET /roles`, `GET /roles/:id`, `GET /rbac/roles/permissions?role_id=` | `roles/read` **o** `rbac/manage` (para elegir qué asignar) |
| `POST /roles`, `PUT /roles/:id`, `DELETE /roles/:id` | `roles/manage` |
| `GET /permissions`, `GET /permissions/:id` | `permissions/read` **o** `rbac/manage` |
| `POST /permissions`, `PUT /permissions/:id`, `DELETE /permissions/:id` | `permissions/manage` |
| `POST /rbac/users/roles/assign`, `POST /rbac/users/roles/remove` | `rbac/manage` + no escalar (abajo) |
| `POST /rbac/roles/permissions/assign`, `POST /rbac/roles/permissions/remove` | `rbac/manage` + no escalar |
| `GET /rbac/users/roles?user_id=`, `GET /rbac/users/effective-permissions?user_id=` | Propio usuario: solo autenticación. Otro usuario: `rbac/manage` |
| `POST /auth/authorize` | `user_id` propio: solo autenticación. Otro usuario: `rbac/manage` |
| `GET /auth/session` | Autenticación (devuelve los permisos efectivos del propio usuario) |
| `/tenants/*` | `tenants/manage` en la empresa de plataforma (incremento 1) |
| `GET /users` | `users/read` **o** `rbac/manage` (para elegir a quién asignar) |
| `GET /users/by-email` | `users/read` |
| `GET /users/:id` | Propio usuario: solo autenticación. Otro: `users/read` |
| `POST /users` | `users/manage` |
| `PUT /users/:id` | `users/manage` + cubrir los permisos efectivos del usuario objetivo (uno mismo: permitido) |
| `DELETE /users/:id` | `users/manage` + cubrir sus permisos; **nunca el propio usuario** (`409 you cannot delete your own user`) |

### kali-invoice-service

| Operación | Permiso |
| --- | --- |
| `GET /invoices`, `GET /invoices/:id` | `invoices/read` |
| `POST /invoices`, `PUT /invoices/:id`, `PATCH /invoices/:id/pay`, `PATCH /invoices/:id/cancel` | `invoices/manage` |
| `GET /invoice-items`, `GET /invoice-items/:id` | `invoice-items/read` |
| `POST /invoice-items`, `PUT /invoice-items/:id`, `DELETE /invoice-items/:id` | `invoice-items/manage` |
| `GET /customers` | `customers/read` |
| `POST /customers` | `customers/manage` |
| `GET /products` | `products/read` |
| `POST /products` | `products/manage` |
| `GET /metrics` | Pública (sin cambios) |

Facturación obtiene los permisos efectivos del usuario de `GET /auth/session` de auth (el mismo
token), con caché por usuario de `TENANT_STATUS_CACHE_SECONDS`.

## Navegación de la interfaz

Cada permiso lleva a su funcionalidad sin exigir permisos ajenos: `users/read` → Usuarios;
`roles/read` o `rbac/manage` → Roles (con `rbac/manage`, la gestión de asignaciones);
`permissions/read` → Permisos; `tenants/manage` en la plataforma → Empresas; permisos de
facturación → Facturas, Clientes o Productos. Sin ningún permiso, la sesión es válida y se
muestra "Sin acceso a módulos" con opción de cerrar sesión.

## Reglas contra escalamiento de privilegios

1. **No otorgar más de lo propio.** Para asignar o quitar un rol a un usuario, o un permiso a
   un rol, quien opera debe **cubrir** con sus permisos efectivos cada permiso implicado
   (comodines incluidos). Ejemplo: solo quien tiene `*/*` puede asignar un rol que contenga
   `*/*`. Error: `403 cannot grant privileges you do not have`.
2. Lo mismo al **crear o editar** un permiso con comodín (`*`) o `tenants/manage`.
3. **Administración de plataforma:** `tenants/manage` solo tiene efecto en la empresa de
   plataforma; las reglas 1 y 2 impiden otorgarlo a quien no lo tiene.

## Integridad y protección del administrador

| Regla | Respuesta |
| --- | --- |
| Nombre de rol único por empresa, sin distinguir mayúsculas ni espacios exteriores | `409 role name already exists` |
| Permiso único por (empresa, recurso, acción) normalizados | `409 permission already exists` |
| Asignar algo ya asignado | `200`, sin duplicar (idempotente) |
| Eliminar un rol asignado a usuarios | `409 role is assigned to users` |
| Eliminar un permiso asignado a roles | `409 permission is assigned to roles` |
| Editar un permiso asignado a roles (cambiaría los accesos de otros) | `409 permission is assigned to roles` |
| Eliminar un rol sin usuarios | Se eliminan también sus vínculos rol↔permiso (no afecta accesos) |
| Modificar o eliminar el rol `admin` sembrado de la plataforma, o quitarle su permiso | `409 protected administrative role` |
| Modificar o eliminar el permiso `*/*` de la plataforma | `409 protected administrative permission` |
| Una operación que deje a la empresa sin **administrador efectivo** | `409 operation would leave the tenant without an administrator` |
| Editar o eliminar a otro usuario sin cubrir sus permisos efectivos | `403 cannot manage a user with privileges you do not have` |
| Eliminar un usuario con roles asignados (sin cascada) | `409 user has roles assigned` |
| Usuario eliminado | Sus tokens: `401 invalid access token` (auth inmediato; facturación ≤ 5 s) |

**Administrador efectivo** de una empresa: usuario de esa empresa cuyos permisos efectivos
cubren `roles/manage`, `permissions/manage` y `rbac/manage`. La regla solo bloquea si antes
de la operación había al menos uno y después no quedaría ninguno.

## Rol `invoicing` de la demo

La semilla demo (`kali-invoice-tests/cypress/e2e/demo/seed-video-demo.cy.ts`) asigna al rol
`invoicing` los permisos `invoices/manage`, `invoice-items/manage`, `customers/manage` y
`products/manage`, para que siga funcionando con la autorización por operación. Es repetible:
volver a ejecutarla completa los permisos de una empresa demo existente.

## Datos existentes: diagnóstico y plan de migración

Diagnóstico de solo lectura sobre la base de desarrollo (14 nov 2026). **No se aplicó ninguna
limpieza.** El arranque crea cada índice único solo si su tabla no tiene duplicados; si los
tiene, lo deja pendiente y lo registra (`WARN rbac integrity: … pendiente`).

| Comprobación | Resultado | Índice |
| --- | --- | --- |
| Roles duplicados (empresa, nombre normalizado) | 0 | `idx_roles_tenant_name_unique`: **creado** |
| Permisos duplicados (empresa, recurso, acción normalizados) | **1 grupo:** `invoices/*` × 13 en `master-tenant` | `idx_permissions_tenant_resource_action_unique`: **pendiente** |
| Asignaciones usuario↔rol duplicadas | 0 | `idx_user_roles_unique`: **creado** |
| Asignaciones rol↔permiso duplicadas | 0 | `idx_role_permissions_unique`: **creado** |
| Asignaciones huérfanas (rol, usuario o permiso inexistente) | 0 | — |
| Vínculos entre empresas distintas | 0 | — |
| Permisos fuera del catálogo o sin normalizar | 0 | — |
| Empresas con administrador efectivo | 2 (`master-tenant`: 13 usuarios; "InvoiceKali Demo SENA": 1) | — |
| Empresas sin administrador efectivo | 43 (empresas de prueba) | — |
| Roles con usuarios pero **sin permisos** (acceso que solo daba el nombre del rol en la interfaz) | 4: `invoicing` de "Empresa Demo" (`0ad7c35b-1222-4d75-824a-a2751b87faf4`) y 3 `admin` de empresas de prueba CP-E2E-008 (`1293f0b5-…`, `13351d94-…`, `e7f06bd8-…`) | — |

De las 13 copias de `invoices/*`, solo `6ac4a550-3e64-419d-b295-27db2b0dbb6c` está asignada
(a 13 roles de prueba GA10); las otras 12 no tienen asignaciones. Las creó GA10 en corridas
anteriores; GA10 ya reutiliza el permiso existente.

### Plan de migración (aprobado y aplicado el 14 nov 2026)

| Paso | Acción | Efecto sobre accesos |
| --- | --- | --- |
| M1 | Eliminar las 12 copias **sin asignaciones** de `invoices/*` en `master-tenant`, conservando `6ac4a550-…` (la asignada). Al reiniciar auth se crea el índice pendiente. | Ninguno: ningún rol las usa. |
| M2 | Ejecutar la semilla demo (`npx cypress run --spec cypress/e2e/demo/seed-video-demo.cy.ts`): asigna al rol `invoicing` de "Empresa Demo" `invoices`, `invoice-items`, `customers` y `products` con `manage`. | Restablece el acceso a facturación de ese rol (hoy 403 por la autorización por operación). |
| M3 | Roles `admin` sin permisos de las empresas de prueba CP-E2E-008: no se recomienda cambiarlos (son datos de prueba); si se quisiera conservar su acceso, asignarles `roles/manage`, `permissions/manage` y `rbac/manage`. | Hoy ven el menú por el nombre del rol, pero la API les responde 403. |
| M4 | Empresas de prueba con nombre en blanco y código `master`: `sh scripts/maintenance/fix-test-tenants-inc1.sh --apply` (en `kali-invoice-tests`; sin `--apply` solo simula). | Libera el código `master`; no toca la empresa de plataforma. |

### Resultado de la aplicación

| Paso | Resultado |
| --- | --- |
| M1 | Respaldo recuperable en `kali-backups/2026-11-14-rbac-m1/` (CSV de las 13 filas y sus 13 vínculos, `restore.sql` con las 12 filas, `pg_dump` de `permissions` y `role_permissions`, SHA-256). Transacción con precondiciones (13 copias; la conservada con vínculos; las 12 sin referencias; exactamente 12 borradas; sin duplicados después): **aplicada**. Al reiniciar auth se creó `idx_permissions_tenant_resource_action_unique`; la base rechaza un duplicado (comprobado en una transacción revertida). |
| M2 | Semilla ejecutada: el rol `invoicing` de "Empresa Demo" tiene `invoices`, `invoice-items`, `customers` y `products` con `manage`. Antes: `GET /invoices` → 403; después: 200, y el usuario creó y pagó una factura de verificación (`12040338-bf03-4cfe-bb75-55a041b7f747`, con cliente "Verificación M2 Cliente" y producto `M2-VERIF`). |
| M3 | Sin cambios: los 3 roles `admin` de prueba siguen con 0 permisos. |
| M4 | Script aplicado: `fba1f76e-…` → "Prueba CP-INT-010 nombre en blanco" / `cp-int-010-nombre-en-blanco`; `56a9f9f0-…` → "Prueba CP-E2E-008 Duplicada mwforwzb58o" / `cp-e2e-008-duplicada-mwforwzb58o`. Ninguna empresa usa ya el código `master`; la de plataforma (`master-tenant`) no cambió. |

**Integridad cerrada:** los cuatro índices únicos RBAC existen en la base de desarrollo y el
arranque no registra avisos `rbac integrity`.

## Propagación de los cambios de permisos

- **API de auth:** aplica los cambios de inmediato (evalúa los permisos en cada petición).
- **Facturación:** puede tardar hasta **5 segundos** (`TENANT_STATUS_CACHE_SECONDS`, caché por usuario).
- **Menú de la interfaz:** se calcula con los permisos recibidos al iniciar sesión; un cambio de
  roles o permisos se refleja en el menú cuando el usuario **vuelve a iniciar sesión**.

## Pendientes

- Permiso de solo lectura de empresas (`tenants/read`).
- Administrar desde la interfaz el RBAC de otras empresas.
