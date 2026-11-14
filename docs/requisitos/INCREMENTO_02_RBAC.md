# Incremento 2 — Roles, permisos y asignaciones (RF-06 a RF-09)

Estado (14 nov 2026): **cerrado.** Implementado, probado e integridad aplicada en la base de
desarrollo (migración M1–M4, ver MATRIZ_PERMISOS.md). Contrato técnico:
[MATRIZ_PERMISOS.md](MATRIZ_PERMISOS.md). Rama `feature/rbac` en los cuatro repos.

## Requisitos de origen (acta GA8)

| ID | Texto | Equivalencias |
| --- | --- | --- |
| RF-06 | Administrar roles por tenant | TRZ-RF-05 (parte); GA10 F10, F14 |
| RF-07 | Administrar permisos por recurso y acción | TRZ-RF-05 (parte); GA10 F11, F14 |
| RF-08 | Asignar y remover roles a usuarios y permisos a roles | GA10 F14 |
| RF-09 | Evaluar permisos efectivos de un usuario | TRZ-RF-06 |

## Decisiones (14 nov 2026)

| ID | Decisión |
| --- | --- |
| D2-01 | Roles: `roles/manage` (lectura `roles/read`); permisos: `permissions/manage` (lectura `permissions/read`); asignaciones: `rbac/manage`. Se comprueban en el servidor, también en llamadas directas a la API. `manage` incluye `read`. |
| D2-02 | Nombre de rol único por empresa sin distinguir mayúsculas ni espacios exteriores; permiso único por (empresa, recurso, acción) normalizados; asignar dos veces es idempotente. |
| D2-03 | Eliminar un rol asignado a usuarios o un permiso asignado a roles → 409 con mensaje claro. Un rol sin usuarios se elimina con sus vínculos rol↔permiso. Editar un permiso asignado también → 409 (cambiaría accesos de otros). |
| D2-04 | No se puede modificar ni eliminar el rol `admin` sembrado ni su permiso `*/*`, ni quitárselo; ninguna operación puede dejar una empresa sin administrador efectivo. |
| D2-05 | Consultar los permisos o roles propios está permitido; los de otros usuarios exigen `rbac/manage` en el ámbito autorizado. |
| D2-06 | Catálogo cerrado de recursos y acciones basado en las operaciones existentes, con comodín `*`. |
| D2-07 | La interfaz administra solo la empresa de la sesión; administrar RBAC de otras empresas desde la plataforma queda pendiente. |
| D2-09 | Facturación exige permiso por operación. El rol `invoicing` de la demo conserva su funcionamiento (la semilla le asigna permisos). |
| — | No otorgar privilegios superiores a los propios; protección especial de `*/*` y de la administración de plataforma. |
| — | `tenants/manage` sigue cubriendo consultar y modificar empresas (solo lectura: pendiente). |
| D2-08 | Datos existentes: sin limpieza automática; diagnóstico y plan de migración primero. |

## Criterios de aceptación

| ID | Criterio |
| --- | --- |
| CA-06.1 | Con `roles/read` se ven los roles de la propia empresa; sin él, 403 (API) y "acceso denegado" sin pedir datos (interfaz). |
| CA-06.2 | Con `roles/manage` se crea un rol (devuelve el rol creado): nombre obligatorio (400), recortado; nombre repetido en la empresa sin distinguir mayúsculas → 409 `role name already exists` (también al editar). |
| CA-06.3 | Editar o eliminar un rol inexistente o de otra empresa → 404. |
| CA-06.4 | Eliminar un rol asignado a usuarios → 409 `role is assigned to users`; sin usuarios se elimina con sus vínculos de permisos. |
| CA-06.5 | El rol `admin` sembrado de la plataforma no se modifica, no se elimina ni se le quitan permisos → 409 `protected administrative role`. |
| CA-07.1 | Con `permissions/read` se ven los permisos; con `permissions/manage` se crean, editan y eliminan. |
| CA-07.2 | Recurso y acción del catálogo (o `*`), normalizados; fuera del catálogo → 400 `unknown permission resource/action`; duplicado → 409 `permission already exists`. |
| CA-07.3 | Eliminar o editar un permiso asignado → 409 `permission is assigned to roles`; el `*/*` de la plataforma → 409 `protected administrative permission`. |
| CA-08.1 | Con `rbac/manage` se asignan y quitan roles a usuarios y permisos a roles; repetir una asignación no duplica (200). |
| CA-08.2 | **No escalar:** asignar o quitar un rol exige cubrir todos sus permisos; asignar o quitar un permiso exige cubrirlo; crear o editar un permiso con `*` o `tenants/manage` exige cubrirlo → 403 `cannot grant privileges you do not have`. |
| CA-08.3 | Referencias de otra empresa → 404; apuntar a otra empresa → 403 `tenant mismatch`. |
| CA-08.4 | Ninguna asignación ni desasignación deja a la empresa sin administrador efectivo → 409 `operation would leave the tenant without an administrator`. |
| CA-09.1 | `POST /auth/authorize` y los permisos efectivos se evalúan con comodines y `manage⇒read`, y reflejan los cambios de inmediato; las asignaciones huérfanas no rompen la evaluación. |
| CA-09.2 | Consultar lo propio está permitido; lo de otro usuario exige `rbac/manage`. |
| CA-FA.1 | Facturación exige el permiso de cada operación (tabla en MATRIZ_PERMISOS.md) → 403 `insufficient permissions`; los permisos se toman de `/auth/session` con caché por usuario (≤ 5 s). |
| CA-FA.2 | La semilla demo deja el rol `invoicing` con permisos de facturación; es repetible. |
| CA-RB.1 | Empresa suspendida → 403 `tenant is suspended` en todas las operaciones (incremento 1). |
| CA-RB.2 | Interfaz: páginas Roles y Permisos, permisos del rol y asignación de roles a usuarios de la empresa de la sesión; acciones visibles según permisos; errores en español. |

## Defectos encontrados y corregidos

| Defecto | Corrección |
| --- | --- |
| Cualquier usuario autenticado podía crear roles y permisos y asignárselos | Autorización por operación y regla de no escalamiento |
| Sin unicidad de roles ni permisos; asignaciones duplicables | Comprobación en la aplicación + índices únicos (condicionados a los datos) |
| Borrar un rol o permiso dejaba asignaciones huérfanas que podían romper la evaluación | 409 si está asignado; evaluación que ignora huérfanos |
| `POST /roles` y `POST /permissions` no devolvían la entidad creada | Devuelven 201 con la entidad |
| La interfaz no enviaba `Idempotency-Key` en `DELETE` (auth y facturación lo exigen: 400) | `AxiosHttpClient` lo envía también en `DELETE` |
| El front interpretaba `/rbac/users/roles` y `/rbac/roles/permissions` como entidades; son vínculos | Repositorios y páginas corregidos |

## Checklist con evidencia

| Criterio | Evidencia | Resultado |
| --- | --- | --- |
| CA-06.1–06.4, CA-07.1–07.3 | CP-INT-011 (autorización, nombres, catálogo, unicidad, 409 asignados, borrado con vínculos); CP-E2E-009 (UI crear, duplicados en español, borrar, solo lectura, acceso denegado); Vitest `roleForm`, `permissionForm`, `HttpRbacRepositories` | ✅ |
| CA-06.5, CA-07.3 (protección) | CP-INT-011 "Protección del administrador sembrado" (5 operaciones → 409) | ✅ |
| CA-08.1 | CP-INT-011 (idempotencia sin duplicados); CP-E2E-009 (permisos del rol y roles del usuario en la UI) | ✅ |
| CA-08.2 Escalamiento | CP-INT-011 (`*/*`, `tenants/manage`, rol con `*/*`, quitar a un superior, autoasignarse un permiso); Go `TestCoversAll_NoEscalation`, `TestCovers`, `TestIsSensitiveGrant` | ✅ |
| CA-08.3 Aislamiento | CP-INT-011 (404 rol ajeno, 403 tenant mismatch); CP-SEC-001 (10/10 con usuarios con permisos) | ✅ |
| CA-08.4 Administrador | CP-INT-011 (quitar `rbac/manage` del rol de ambos admins → 409; quitar al segundo → 200; quitarse a sí mismo → 409); Go `TestCountAdministrators_Simulation`, `TestIsEffectiveAdministrator` | ✅ |
| CA-09.1, 09.2 | CP-INT-011 (propio sí, otros 403; `authorize` evalúa con `manage⇒read`); Go `TestHasPermission_ManageImpliesRead` | ✅ |
| CA-FA.1 | CP-INT-012 (sin permisos 403 en todo salvo `/metrics`; read vs manage; cambio aplicado sin reemitir token); Go facturación `tests/http/routes/permissions_test.go`, `permissions_test.go` (matriz completa, caché por usuario) | ✅ |
| CA-FA.2 | Semilla demo en copia limpia (rol `invoicing` con permisos; repetible) | ✅ |
| CA-RB.1 | CP-INT-011 "aislamiento y suspensión"; CP-SEC-002 | ✅ |

### Ejecuciones (estado final, 14 nov 2026)

| Comprobación | Resultado |
| --- | --- |
| auth `go build`, `go vet`, `go test ./...` | ✅ 6 paquetes |
| facturación `go build`, `go vet`, `go test ./...` | ✅ 8 paquetes |
| front `tsc -b`, `lint`, `build`, `npm test` | ✅ 8 archivos, 101 pruebas |
| **Regresión completa en una sola corrida** sobre el estado final (copia limpia, arranque desde cero con `stack:up`, volúmenes nuevos, `.env.dev` creados desde los ejemplos) | ✅ **104/104**, 20 especificaciones, sin reintentos ni corridas combinadas |
| Arranque desde cero: avisos de integridad | 0 |
| Base de desarrollo existente tras M1–M4: avisos de integridad al arrancar | 0; los 4 índices únicos RBAC creados |
| Entorno de desarrollo restaurado | ✅ `stack:health` 7/7; ningún volumen previo perdido |

Corrección de un informe anterior: el "104/104" de la primera entrega sumaba una corrida completa
(102/104) y una repetición de las dos especificaciones ajustadas; no fue una corrida única.

## Pendientes

- Administrar RBAC de otras empresas desde la plataforma (interfaz).
- `tenants/read` (solo lectura de empresas).
- Exigir `users/read` / `users/manage` en el servidor (incremento 3).
- **Comportamiento documentado (no defecto):** el menú de la interfaz actualiza los permisos al
  volver a iniciar sesión; la API de auth los aplica de inmediato y facturación puede tardar hasta
  5 segundos.
- Los 3 roles `admin` de prueba sin permisos (M3) se conservan por indicación: sus usuarios ven el
  menú por el nombre del rol, pero la API les responde 403.
