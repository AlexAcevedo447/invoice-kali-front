# Incremento 1 — Gestión de empresas (RF-05)

## Requisito de origen

- **RF-05 (acta GA8):** "Crear, listar, consultar, activar y suspender tenants. Endpoints
  `/api/v1/tenants` y tabla `tenants`." Equivale a TRZ-RF-04 y GA10 F9/F14.
- **Alcance pedido para este incremento:** listado, creación, edición, activación y
  suspensión, restringidos al administrador de plataforma.
- **Contrato existente que se conserva:** código legible de empresa (3-40 minúsculas,
  dígitos o guiones; único), login de una empresa suspendida `403 tenant is suspended`.
- **Reglas de seguridad pedidas al cierre (14 nov 2026):** restringir al administrador
  autorizado de plataforma según el RBAC existente, impedir suspender la empresa de
  plataforma, bloquear también las sesiones vigentes de una empresa suspendida en auth y
  facturación, y avisar en la interfaz que cambiar el código afecta el próximo inicio de
  sesión. Sin eliminación ni notificaciones.
- **Administrador de plataforma (definición con el RBAC existente):** usuario de la empresa
  de plataforma (`SEED_MASTER_TENANT_ID`) cuyos permisos efectivos (roles → permisos,
  evaluados por `AuthorizeQuery`) incluyen `tenants/manage`, con los comodines existentes
  (`*`). El administrador sembrado lo cumple con `*/*`. No se creó ningún rol nuevo.

## Criterios de aceptación

| ID | Criterio |
| --- | --- |
| CA-05.1 | El administrador de plataforma ve la lista de empresas con nombre, código y estado. |
| CA-05.2 | Puede crear una empresa con nombre obligatorio y código opcional; si omite el código, el servidor lo deriva del nombre. La empresa nace activa. |
| CA-05.3 | Validaciones al crear y editar: nombre vacío → 400 `tenant name is required`; código con formato inválido → 400; código ya usado → 409 `tenant code already exists`. La interfaz valida antes de enviar y muestra los mensajes del servidor en español. |
| CA-05.4 | Puede consultar una empresa por su identificador; si no existe → 404. |
| CA-05.5 | Puede editar nombre y código. Editar no cambia el estado. Una empresa inexistente → 404. Un estado distinto de `ACTIVE`/`SUSPENDED` → 400. |
| CA-05.6 | Puede suspender y activar. Una empresa inexistente → 404. Con la empresa suspendida, sus usuarios no pueden iniciar sesión (`403 tenant is suspended`); al reactivarla, sí. La interfaz pide confirmación antes de suspender. |
| CA-05.7 | **Autorización:** todas las operaciones de empresas responden `403 platform administrator required` a cualquiera que no sea el administrador de plataforma: usuarios de otras empresas (incluido su administrador) y **usuarios de la plataforma sin `tenants/manage`**. Solo ese administrador puede además apuntar a otra empresa al crear usuarios o roles (los demás: `403 tenant mismatch`). En la interfaz, el menú "Empresas" solo aparece con esa autorización y la ruta directa muestra "acceso denegado" sin pedir datos. |
| CA-05.8 | **Aislamiento:** un usuario de otra empresa no puede listar ni consultar empresas (403), ni conocer si una empresa existe. |
| CA-05.9 | La empresa de plataforma no se puede suspender, ni por `/suspend` ni por `PUT` con `SUSPENDED`: `409 platform tenant cannot be suspended`. En la interfaz, "Suspender" está deshabilitado en su fila con el motivo. |
| CA-05.10 | **Sesiones vigentes:** con la empresa suspendida, un token emitido antes de la suspensión recibe `403 tenant is suspended` en todas las operaciones protegidas de auth (de inmediato) y de facturación (como máximo `TENANT_STATUS_CACHE_SECONDS`, 5 s). La interfaz cierra la sesión y muestra "Empresa suspendida". Al reactivarla, el mismo token vuelve a funcionar mientras no haya vencido (política existente: `JWT_ACCESS_TOKEN_TTL_MINUTES`). |
| CA-05.11 | Al editar, si el código cambia, la interfaz advierte que puede afectar el próximo inicio de sesión de los usuarios que ingresan con el código anterior. Cambiar solo el nombre no muestra el aviso. |

## Decisiones de negocio

| ID | Punto | Resolución |
| --- | --- | --- |
| D-01 | ¿Quién es "administrador de plataforma"? | **Resuelta (14 nov):** usuario de la plataforma con `tenants/manage` según el RBAC existente (CA-05.7). |
| D-02 | ¿Se puede suspender la empresa de plataforma? | **Resuelta:** no (CA-05.9). |
| D-03 | Sesiones abiertas de una empresa suspendida | **Resuelta:** se bloquean; al reactivar se restablecen según la vigencia del token (CA-05.10). |
| D-04 | ¿Se pueden eliminar empresas? | Fuera de alcance por indicación: no se implementa. |
| D-05 | Cambio de código | **Resuelta:** se advierte en la interfaz (CA-05.11); sin notificaciones por indicación. |
| D-06 | **Abierta.** En la base de desarrollo, la empresa de prueba "Duplicada mwforwzb58o" (`56a9f9f0-f633-49f9-927a-ebe718921f3e`) tiene el código `master`, porque la empresa de plataforma existía antes de los códigos y recibió otro. Un login con `tenant_code: "master"` resolvería esa empresa de prueba. ¿Se le cambia el código, se suspende o se deja? | Sin cambios (no se borran ni modifican empresas de prueba). |
| D-07 | **Abierta.** Granularidad del permiso: hoy una sola acción (`tenants/manage`) cubre leer y modificar empresas. ¿Hace falta separar lectura (`tenants/read`)? | Una sola acción. |

## Defectos encontrados y corregidos en este incremento

| Defecto previo | Corrección |
| --- | --- |
| Activar, suspender o editar una empresa inexistente respondía 200 | Se comprueban las filas afectadas: 404 `resource not found` |
| `PUT` aceptaba cualquier estado (p. ej. `"DELETED"` se guardaba como `ACTIVE`) | 400 `tenant status must be ACTIVE or SUSPENDED` |
| Un nombre solo con espacios se aceptaba (201) | Se recorta: 400 `tenant name is required` |
| La interfaz no podía saber si la sesión es de la empresa de plataforma | Campo aditivo `is_platform_tenant` en el login, calculado con la misma configuración que `PlatformOnly` |

Efecto secundario registrado: la primera ejecución de CP-INT-010, antes de corregir el
nombre en blanco, creó en la base de desarrollo una empresa con nombre de espacios y
otra llamada "Duplicada …" (prueba de UI con un código que no existía). No se borraron.

## Checklist con evidencia

Fecha: 14 de noviembre de 2026. Rama `feature/gestion-empresas`.

| Criterio | Evidencia | Resultado |
| --- | --- | --- |
| CA-05.1 Listar | CP-INT-010 "lista con nombre, código y estado"; CP-E2E-008 flujo completo | ✅ |
| CA-05.2 Crear (código opcional, nace activa) | CP-INT-010 "crea activa; sin código lo deriva"; CP-E2E-008 | ✅ |
| CA-05.3 Validaciones | CP-INT-010 (400 nombre, 400 formato, 409 crear y editar); CP-E2E-008 (validación local sin petición y 409 en español); Vitest `tenantForm.schema.test.ts`, `backendMessages.test.ts`; Go `TestUpdateTenantHandler_BlankName_Returns400` | ✅ |
| CA-05.4 Consultar / 404 | CP-INT-010 | ✅ |
| CA-05.5 Editar sin cambiar estado; estado inválido; 404 | CP-INT-010; CP-E2E-008; Go `TestUpdateTenantHandler_InvalidStatus_Returns400`, `_UnknownTenant_Returns404`; Vitest `HttpTenantRepository.test.ts` | ✅ |
| CA-05.6 Suspender/activar y efecto en el login; 404 | CP-INT-010 (login 200 → 403 `tenant is suspended` → 200); CP-E2E-008 (confirmación); Go `TestActivateSuspendHandlers_StatusCodes` | ✅ |
| CA-05.7 Autorización | CP-INT-010 (7 operaciones → 403 para otra empresa); CP-E2E-008 (admin de otra empresa: sin menú, acceso denegado, ninguna petición a `/tenants`); Go `TestLoginHandler_IsPlatformTenantFlag`; Vitest `access.test.ts` | ✅ |
| CA-05.8 Aislamiento | CP-INT-010 (GET de id inexistente también 403: no revela existencia); la empresa no cambia tras los intentos | ✅ |
| CA-05.7 (cierre) Plataforma sin permiso | CP-INT-010 "usuario de la plataforma sin tenants/manage" (4 operaciones → 403 y crear usuario en otra empresa → 403 tenant mismatch); CP-E2E-008 (usuario de plataforma con `users/read`: sin menú, acceso denegado, sin peticiones); Go `TestPlatformAdmin_PlatformUserWithoutPermission_Forbidden`, `TestScope_PlatformUserWithoutPermission_CannotTargetOtherTenant`, `TestPlatformAdmin_NoAuthorizer_FailsClosed`; Vitest `access.test.ts` | ✅ |
| CA-05.9 Plataforma no suspendible | CP-INT-010 (409 por `/suspend` y `PUT`); CP-E2E-008 (botón deshabilitado con motivo); Go `TestPlatformTenant_CannotBeSuspended` | ✅ |
| CA-05.10 Sesiones vigentes | CP-SEC-002 (token previo: 200 → 403 en auth y facturación → 200 al reactivar); CP-E2E-008 (sesión abierta cerrada con "Empresa suspendida"); Go auth `TestActiveTenant_SuspendedTenant_BlocksExistingTokens`; Go facturación `TestTenantStatus_*` (bloqueo, restablecimiento, caché, auth caído → 503); Vitest `sessionEnd.test.ts` | ✅ |
| CA-05.11 Aviso de código | CP-E2E-008 (aparece solo si cambia el código normalizado) | ✅ |

### Ejecuciones (cierre, 14 nov 2026)

| Comprobación | Resultado |
| --- | --- |
| auth: `go build`, `go vet`, `go test ./...` | ✅ 5 paquetes |
| facturación: `go build`, `go vet`, `go test ./...` | ✅ 7 paquetes (incluye `TestTenantStatus_*`) |
| front: `npm run lint`, `tsc -b`, `npm run build` | ✅ |
| front: `npm test` (Vitest 5.0.5) | ✅ 5 archivos, 47 pruebas |
| Cypress CP-INT-010 + CP-SEC-002 + CP-E2E-008 en el entorno de desarrollo | ✅ 19/19 |
| Regresión completa en copia limpia con volúmenes nuevos (`npm run stack:up`) | ✅ 87/87 (incluye CP-INT-005 sobre base vacía, GA10 y semilla) |
| `stack:health` del entorno de desarrollo restaurado | ✅ 7/7 |

### Empresas de prueba creadas en la base de desarrollo

No se borraron ni modificaron. 21 empresas, todas activas; se distinguen por el prefijo del
nombre o del código (`cp-int-010`, `cp10-`, `Empresa Derivada`, `cp-e2e-008`, `CP-E2E-008`,
`cp-sec-002`). Dos requieren atención:

| Id | Código | Nombre | Nota |
| --- | --- | --- | --- |
| `fba1f76e-dbee-49a2-ad33-525cce4e8805` | `000` | (solo espacios) | Creada antes de corregir la validación del nombre |
| `56a9f9f0-f633-49f9-927a-ebe718921f3e` | `master` | Duplicada mwforwzb58o | Ver D-06 |

### Pendiente de este incremento

- Decisiones abiertas D-06 y D-07.
- Eliminación de empresas y notificaciones: fuera de alcance por indicación.
