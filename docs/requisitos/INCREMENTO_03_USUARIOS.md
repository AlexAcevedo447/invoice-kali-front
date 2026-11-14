# Incremento 3 — Usuarios (RF-04)

Rama `feature/usuarios` (desde `feature/rbac`). Contrato de permisos: [MATRIZ_PERMISOS.md](MATRIZ_PERMISOS.md).

## Requisito de origen

- **RF-04 (acta GA8):** "Crear, consultar, listar, actualizar y eliminar usuarios. Endpoints
  `/api/v1/users` y tablas users/tenants." Equivale a TRZ-RF-03 y GA10 F8/F14.
- **Indicaciones (14 nov 2026):** `users/read` para consultar y `users/manage` para modificar
  (`manage` incluye lectura), validado siempre en el servidor; aislamiento por empresa y
  restricciones de administración entre empresas; reglas RBAC al asignar roles; no eliminar al
  último administrador efectivo; un usuario eliminado pierde acceso con sus tokens; menú basado en
  permisos efectivos, no en el nombre `admin`.

## Hallazgos antes de implementar (14 nov 2026)

1. **Defecto de seguridad:** `GET /users`, `GET /users/:id` y `GET /users/by-email` devuelven el
   hash de la contraseña (`Password`, argon2) de cada usuario.
2. Las rutas de usuarios no exigen ningún permiso: cualquier usuario autenticado de una empresa
   puede crear, editar o eliminar usuarios de su empresa.
3. Editar exige siempre una contraseña nueva (no se puede cambiar solo el nombre o el correo).
4. **Registros relacionados:** lo único que referencia a un usuario es `user_roles.user_id` (auth;
   sin claves foráneas). Facturación no guarda referencias a usuarios. Hoy, eliminar un usuario
   deja sus asignaciones de rol huérfanas.
5. Un token de un usuario eliminado sigue siendo aceptado hasta vencer (solo se comprueba la empresa).
6. La interfaz muestra Facturación y Administración por el **nombre** del rol (`invoicing`, `admin`)
   aunque el rol no tenga permisos.

## Criterios de aceptación

| ID | Criterio |
| --- | --- |
| CA-04.1 | Con `users/read` se lista y consulta a los usuarios de la propia empresa (identificación, usuario, correo); **nunca** se devuelve la contraseña ni su hash. Sin `users/read`: 403 (API) y "acceso denegado" sin pedir datos (interfaz). Consultar el propio usuario no exige permiso. |
| CA-04.2 | Con `users/manage` se crea un usuario: correo y contraseña obligatorios, contraseña según la política existente, correo único por empresa (409). Devuelve el usuario creado (sin contraseña). |
| CA-04.3 | Con `users/manage` se edita identificación, usuario y correo; la contraseña es opcional (vacía = se conserva; si se indica, cumple la política). Correo repetido en la empresa → 409. |
| CA-04.4 | Con `users/manage` se elimina un usuario, con confirmación en la interfaz. |
| CA-04.5 | **Aislamiento:** usuario de otra empresa → 404 sin revelar que existe; apuntar a otra empresa → 403 `tenant mismatch` salvo el administrador de plataforma (incremento 1). |
| CA-04.6 | **No escalar:** asignar roles al crear o después sigue las reglas RBAC (`rbac/manage` y cubrir los permisos del rol). Editar o eliminar a un usuario exige cubrir **sus** permisos efectivos (no se puede tomar la cuenta ni eliminar a alguien con más privilegios) → 403 `cannot manage a user with privileges you do not have`. Editarse a uno mismo está permitido. |
| CA-04.7 | **Último administrador:** eliminar a un usuario que deje a la empresa sin administrador efectivo → 409 `operation would leave the tenant without an administrator`. Los demás cambios de usuario (identificación, nombre, correo, contraseña) no alteran sus permisos; la empresa no se puede cambiar. Quitar roles ya está protegido (incremento 2). |
| CA-04.8 | **Registros relacionados (decisión de este incremento, sin cascada):** eliminar un usuario que aún tiene roles asignados → 409 `user has roles assigned`; primero se le quitan los roles (con las reglas RBAC). Así no quedan asignaciones huérfanas y no se borra nada en cascada. |
| CA-04.9 | **Tokens existentes:** un usuario eliminado recibe 401 `invalid access token` con sus tokens ya emitidos en auth (inmediato) y en facturación (como máximo `TENANT_STATUS_CACHE_SECONDS`, 5 s). |
| CA-04.10 | **Menú por permisos efectivos:** "Facturación" (Facturas, Clientes, Productos) y "Administración" se muestran según permisos (`invoices`/`customers`/`products`… y `users`/`roles`/`permissions`/`rbac` con `read`, o `tenants/manage`), no por el nombre del rol. El menú se actualiza al volver a iniciar sesión. |
| CA-04.11 | Interfaz: listado con búsqueda, crear, editar, eliminar con confirmación; validaciones antes de enviar y errores en español. |
| CA-04.12 | **Usuario sin permisos:** con credenciales y empresa válidas el login funciona; la interfaz muestra "Sin acceso a módulos" (ruta `/sin-acceso`) con botón de cerrar sesión, sin bucles de redirección y sin confundirse con credenciales incorrectas. |
| CA-04.13 | **Cada permiso llega a su funcionalidad sin exigir permisos ajenos:** `rbac/manage` solo → Roles con la gestión de asignaciones (el servidor le permite consultar roles, permisos y usuarios necesarios para asignar); `tenants/manage` en la plataforma → Empresas. |
| CA-04.14 | **D3-04:** nadie elimina su propio usuario desde este módulo (`409 you cannot delete your own user`; botón deshabilitado con el motivo). Otro administrador autorizado puede hacerlo, con las demás restricciones. |
| CA-04.15 | Ninguna respuesta de usuarios (crear, editar, listar, consultar, por correo) expone la contraseña ni su hash. |

## Decisiones (confirmadas el 14 nov 2026)

| ID | Decisión |
| --- | --- |
| D3-01 | Eliminar un usuario con roles → 409 (sin cascada). **Confirmada.** |
| D3-02 | Editar o eliminar a otro usuario exige cubrir sus permisos efectivos. **Confirmada.** |
| D3-03 | Contraseña opcional al editar. **Confirmada.** |
| D3-04 | **Cambiada:** se bloquea eliminar el propio usuario desde este módulo; otro administrador autorizado puede eliminarlo respetando las restricciones. |

## Defectos corregidos

| Defecto | Corrección |
| --- | --- |
| La API devolvía el hash de la contraseña de cada usuario | Respuesta pública sin contraseña (`UserResponse`) en listar, consultar y crear |
| Rutas de usuarios sin permisos | `users/read` / `users/manage` en el servidor |
| Editar exigía una contraseña nueva | Contraseña opcional; correo duplicado al editar → 409 (antes podía ser 500) |
| Eliminar dejaba asignaciones huérfanas | 409 si tiene roles (sin cascada) |
| Tokens de un usuario eliminado seguían valiendo | `ActiveTenant` exige que el usuario exista |
| Menú por nombre de rol | Menú y pantalla de inicio por permisos efectivos; `rbac/manage` o `tenants/manage` solos no abren ninguna página de administración |

## Checklist con evidencia

| Criterio | Evidencia | Resultado |
| --- | --- | --- |
| CA-04.1 | CP-INT-013 (lectura, 403 sin permiso, propio usuario, sin `Password` en listar/consultar/por correo); CP-INT-004; CP-E2E-010 (solo lectura; respuesta sin contraseña); Go `TestUserResponse_NeverIncludesPassword` | ✅ |
| CA-04.2 | CP-INT-013 (400 correo/contraseña débil, 409 duplicado, 201 con el usuario); CP-INT-003; CP-E2E-010 | ✅ |
| CA-04.3 | CP-INT-013 (sin contraseña la conserva, con contraseña la cambia, 409 duplicado, 400 débil); CP-E2E-010; Go `TestUpdateUser_*` | ✅ |
| CA-04.4 | CP-E2E-010 (confirmación y eliminación) | ✅ |
| CA-04.5 | CP-INT-013 (404 usuario ajeno, 403 tenant mismatch, suspensión) | ✅ |
| CA-04.6 | CP-INT-013 (no editar/eliminar a un superior, editarse a sí mismo, asignar rol exige `rbac/manage`) | ✅ |
| CA-04.7 | CP-INT-013 (eliminar al último administrador → 409, también a sí mismo) | ✅ |
| CA-04.8 | CP-INT-013 (409 con roles, 204 sin roles); CP-E2E-010 (mensaje en español, el diálogo queda abierto) | ✅ |
| CA-04.9 | CP-INT-013 (token previo: auth 401 inmediato; facturación 401 tras ≤ 5 s); Go `TestActiveTenant_DeletedUser_TokenRejected` | ✅ |
| CA-04.10 | CP-E2E-010 (sin `users/read` no hay Usuarios; rol `admin` sin permisos no entra); Vitest `access.test.ts` | ✅ |
| CA-04.11 | CP-E2E-010 (validaciones en español); GA10 3.1 actualizado; Vitest `userForm.schema.test.ts` | ✅ |
| CA-04.12 | CP-E2E-010 y GA10 3.7 (login correcto → `/sin-acceso`, sin menú, sin bucle al volver a `/`, cerrar sesión) | ✅ |
| CA-04.13 | CP-INT-013 (solo `rbac/manage`: consulta y asigna lo que cubre; solo `tenants/manage`: empresas); CP-E2E-010 (entran directo a Roles con asignaciones y a Empresas); Vitest `access.test.ts` | ✅ |
| CA-04.14 | CP-INT-013 (`409 you cannot delete your own user`; otro administrador llega a las reglas normales); CP-E2E-010 (botón deshabilitado con motivo) | ✅ |
| CA-04.15 | CP-INT-013 (crear, editar, consultar, listar y por correo sin `Password`/hash) | ✅ |

### Ejecuciones (cierre, 14 nov 2026)

| Comprobación | Resultado |
| --- | --- |
| auth `go build`, `go vet`, `go test ./...` | ✅ 8 paquetes |
| facturación `go test ./...` | ✅ 8 paquetes (sin cambios de código) |
| front `tsc -b`, `lint`, `build`, `npm test` | ✅ 11 archivos, 167 pruebas |
| **Regresión completa en una sola corrida** (copia limpia, arranque desde cero, volúmenes nuevos) | ✅ **125/125**, 22 especificaciones |
| Base de desarrollo restaurada | ✅ `stack:health` 7/7, 0 avisos de integridad |

## Pendientes

- Recordatorio (comportamiento documentado): el menú se actualiza al **volver a iniciar sesión**;
  facturación aplica cambios de permisos o la eliminación de un usuario en **≤ 5 s**.
- Usuarios con roles sin permisos (p. ej. los 3 roles `admin` de prueba de M3) inician sesión y
  ven "Sin acceso a módulos" (CA-04.12).
