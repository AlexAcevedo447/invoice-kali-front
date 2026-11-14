# Matriz unificada de requisitos — InvoiceKali

Versión de trabajo del 13 de noviembre de 2026. Unifica las fuentes existentes sin
reemplazarlas; las fuentes originales no se modificaron.

## Fuentes y equivalencias

| Clave | Documento | Numeración |
| --- | --- | --- |
| **ACTA** | `entrega-sena/GA8-220501096-AA1-EV02_InvoiceKali/10_requerimientos/Acta_Aceptacion_Requerimientos_InvoiceKali_GA8.html` (acta 001, "aprobado con observaciones", pendiente de firma) | RF-01…RF-16, RNF-01…RNF-07, ENT-01…ENT-08 |
| **TRZ** | `entrega-sena/GA8-220501096-AA1-EV02_InvoiceKali/03_documentacion_modulos/Matriz_Trazabilidad_Requerimientos.md` (igual a `10_requerimientos/Requerimientos_Identificados.md`) | RF-01…RF-09, RNF-01…RNF-02 (**distinta** de la del acta) |
| **GA10** | `SENA/InvoiceKali/REPORTE_FUNCIONAL_InvoiceKali_GA10.md` | F1…F15 |

**Regla de unificación:** el identificador canónico es el del **ACTA**, porque es el
documento con estado de aceptación. Los identificadores de TRZ se citan con prefijo
`TRZ-` para evitar colisiones (p. ej. TRZ-RF-04 es "Administrar tenants", que en el acta
es RF-05). No se encontraron historias de usuario documentadas.

## Requisitos funcionales

| ID | Requisito (texto del acta) | Equivalencias | Aprobación | Implementación actual | Evidencia / incremento |
| --- | --- | --- | --- | --- | --- |
| RF-01 | Inicio de sesión mediante tenant, correo y contraseña | TRZ-RF-01; GA10 F1 | Acta: cumplido | Implementado y probado. **Cambio sin aprobar:** el usuario ya no escribe el tenant; el servidor lo resuelve y pide el código de empresa solo si el correo existe en varias (ver RF-20) | CP-INT-001, CP-INT-008, GA10 |
| RF-02 | Persistir la sesión del usuario en el frontend | — | Acta: cumplido | Implementado y probado | GA10 |
| RF-03 | Controlar el acceso a rutas protegidas | TRZ-RF-02; GA10 F2 | Acta: cumplido | Implementado y probado | GA10 |
| RF-04 | Crear, consultar, listar, actualizar y eliminar usuarios | TRZ-RF-03; GA10 F8, F14 | Acta: cumplido (backend) | Implementado y probado (API, interfaz, `users/read|manage`, sin contraseñas, no escalar, último administrador) | [Incremento 3](INCREMENTO_03_USUARIOS.md): CP-INT-013, CP-E2E-010, Go, Vitest |
| RF-05 | Crear, listar, consultar, activar y suspender tenants | TRZ-RF-04; GA10 F9, F14 | Acta: cumplido (backend) | Implementado y probado en API e interfaz (más edición), solo para el administrador de plataforma (RBAC `tenants/manage`). La plataforma no se puede suspender; suspender bloquea también sesiones vigentes en auth y facturación. Decisiones abiertas: D-06, D-07 | [Incremento 1](INCREMENTO_01_EMPRESAS.md): CP-INT-010, CP-SEC-002, CP-E2E-008, Go, Vitest |
| RF-06 | Administrar roles por tenant | TRZ-RF-05 (parte); GA10 F10, F14 | Acta: cumplido (backend) | Implementado y probado (API, interfaz y autorización `roles/*`) | [Incremento 2](INCREMENTO_02_RBAC.md): CP-INT-011, CP-INT-012, CP-E2E-009, Go, Vitest |
| RF-07 | Administrar permisos por recurso y acción | TRZ-RF-05 (parte); GA10 F11, F14 | Acta: cumplido (backend) | Implementado y probado (catálogo; unicidad en aplicación y en base de datos) | [Incremento 2](INCREMENTO_02_RBAC.md): CP-INT-011, CP-INT-012, CP-E2E-009, Go, Vitest |
| RF-08 | Asignar y remover roles a usuarios y permisos a roles | GA10 F14 | Acta: cumplido (backend) | Implementado y probado (no escalamiento, idempotencia, administrador efectivo) | [Incremento 2](INCREMENTO_02_RBAC.md): CP-INT-011, CP-INT-012, CP-E2E-009, Go, Vitest |
| RF-09 | Evaluar permisos efectivos de un usuario | TRZ-RF-06 | Acta: cumplido | Implementado y probado (propio sí; otros con `rbac/manage`) | [Incremento 2](INCREMENTO_02_RBAC.md): CP-INT-011, CP-INT-012, CP-E2E-009, Go, Vitest |
| RF-10 | Crear, listar, consultar y actualizar facturas | TRZ-RF-07; GA10 F3, F4, F5 | Acta: cumplido | Implementado y probado | CP-INT-005/006/009, GA10 |
| RF-11 | Pagar y cancelar facturas según reglas de dominio | TRZ-RF-07 (parte); GA10 F6, F7 | Acta: cumplido | Implementado y probado | Pruebas de dominio, GA10 |
| RF-12 | Crear, listar, consultar, actualizar y eliminar ítems | TRZ-RF-08; GA10 F12, F15 | Acta: cumplido | Implementado (API y formulario de factura) y probado | GA10 |
| RF-13 | Registrar y calcular impuestos DEBIT/CREDIT por ítem | TRZ-RF-09 (parte) | Acta: cumplido | Parcial: la interfaz edita solo el impuesto principal | Incremento 4 |
| RF-14 | Calcular subtotal, impuestos y total | TRZ-RF-09 (parte) | Acta: cumplido | Implementado y probado | Pruebas de dominio, CP-INT-006 |
| RF-15 | Exponer métricas internas de facturación | GA10 F15 | Acta: cumplido | Implementado (backend) | `stack:health` |
| RF-16 | Evitar duplicidad en operaciones mutables (Idempotency-Key) | TRZ-RNF-02 | Acta: cumplido | Implementado y probado | CP-INT-007 |

### Funcionalidades implementadas sin requisito aprobado (propuestas)

Se registran para trazabilidad. **No están aprobadas**: requieren revisión y acta.

| ID propuesto | Funcionalidad | Origen | Estado | Evidencia |
| --- | --- | --- | --- | --- |
| RF-17 (propuesto) | Catálogo de clientes por empresa (crear, buscar, listar) | Commit `fd08d14` / `2c8c5c8` | Implementado y probado | CP-SEC-001, GA10 |
| RF-18 (propuesto) | Catálogo de productos por empresa | Commit `fd08d14` / `2c8c5c8` | Implementado y probado | CP-SEC-001, GA10 |
| RF-19 (propuesto) | Cierre de sesión y expiración de sesión | GA10 F13 (antes ausente) | Implementado y probado | GA10 C3 |
| RF-20 (propuesto) | Login con código de empresa cuando el correo existe en varias empresas | Commit `25d995e` | Implementado y probado | CP-INT-008 |
| RNF-08 (propuesto) | Aislamiento de datos entre empresas | Commits `25d995e`, `fd08d14` | Implementado y probado | CP-SEC-001 |
| RNF-09 (propuesto) | Una empresa suspendida no opera con ningún token, incluidos los emitidos antes de la suspensión (auth inmediato; facturación ≤ `TENANT_STATUS_CACHE_SECONDS`) | Incremento 1 (cierre) | Implementado y probado | CP-SEC-002 |

## Requisitos no funcionales y de entrega

| ID | Requisito | Equivalencias | Estado actual |
| --- | --- | --- | --- |
| RNF-01 | Frontend, seguridad y facturación como componentes independientes | — | Cumplido |
| RNF-02 | PostgreSQL | TRZ-RNF-01 | Cumplido |
| RNF-03 | JWT Bearer y hash seguro de contraseñas | — | Cumplido; facturación valida RS256/JWKS (cierra la observación §7 del acta) |
| RNF-04 | Microservicios Go por capas | — | Cumplido |
| RNF-05 | Entorno local con Docker y Docker Compose | — | Cumplido y verificado desde cero |
| RNF-06 | Build de producción del frontend | — | Cumplido |
| RNF-07 | Ejecutables Go | — | Compilan; los binarios ya no se versionan |
| ENT-01…ENT-08 | Entregables de la evidencia GA8 | — | Propios de GA8; no se reevalúan aquí |

## Observaciones del acta (§7) y su estado

| Observación | Estado |
| --- | --- |
| Lint con errores `react-hooks/refs` | Cerrada (lint sin errores) |
| Frontend sin script de pruebas | Cerrada: `npm test` (Vitest) desde el incremento 1 |
| Seguridad sin `*_test.go` | Cerrada (pruebas de login, aislamiento y códigos de empresa) |
| Pruebas integrales bloqueadas | Cerrada (suite Cypress completa en entorno Docker) |
| Protección de facturación por gateway o política externa | Cerrada a nivel de servicio (validación JWT/JWKS propia) |
