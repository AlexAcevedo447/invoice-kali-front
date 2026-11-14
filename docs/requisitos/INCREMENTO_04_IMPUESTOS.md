# Incremento 4 — Impuestos múltiples por línea (RF-13)

Estado: **implementado y probado (14 nov 2026)** en la rama `feature/impuestos` (creada desde
`feature/usuarios`) de los cuatro repositorios. D4-04 está resuelta (se conservan las reglas del
servidor y el cliente no redondea, tampoco al mostrar). Queda una **pregunta de negocio pendiente
(PN-01)**: tarifa máxima y regla de redondeo, que el servidor no define y no se inventaron.

## Requisitos de origen (acta GA8)

| ID | Texto | Equivalencias |
| --- | --- | --- |
| RF-13 | Registrar y calcular impuestos DEBIT/CREDIT por ítem (validación de code, kind y rate; persistencia en `invoice_item_taxes`) | TRZ-RF-09 (parte) |
| RF-14 | Calcular subtotal, impuestos y total de la factura | TRZ-RF-09 (parte) |
| RF-12 | Crear, listar, consultar, actualizar y eliminar ítems | TRZ-RF-08; GA10 F12 |

Indicación (14 nov 2026): impuestos múltiples por línea, **conservando todos los impuestos al
consultar y editar**.

## Situación de partida

1. Servidor: lista de impuestos por línea `{code, kind, rate}` con `rate` como fracción; `PUT
   /invoice-items/:id` reemplaza la lista. Un `kind` vacío se tomaba como DEBIT; se permitían
   códigos repetidos; los impuestos no tenían orden guardado.
2. Interfaz: solo mostraba y editaba el **primer** impuesto; los demás se copiaban sin verse. Una
   línea sin impuestos aparecía como "IVA 0 %"; las líneas nuevas traían "IVA 18 %" por defecto; la
   conversión % ↔ fracción redondeaba a 4 decimales.
3. No había vista de consulta: los impuestos solo se veían al editar.

## Decisiones (resueltas el 14 nov 2026)

| ID | Decisión | Implementación |
| --- | --- | --- |
| D4-01 | Se permiten líneas **sin impuestos**; se muestran como "Sin impuestos", sin inventar un IVA 0 %. | Servidor ya lo admitía. La interfaz admite 0..N impuestos; las líneas nuevas empiezan sin impuestos. |
| D4-02 | Un código **no se repite** en la misma línea, sin distinguir mayúsculas ni espacios exteriores. Validación en cliente y servidor. Los duplicados históricos se informan, no se corrigen. | Servidor: 400 `tax code is repeated in the same item`. Cliente: error en la fila repetida (`El código de impuesto "IVA" está repetido en esta línea.`). Históricos: ver abajo. |
| D4-03 | Códigos de **texto libre**, obligatorios y normalizados (trim + mayúsculas); el tipo DEBIT/CREDIT se elige **explícitamente**; sin catálogo nuevo. | Servidor: `kind` vacío ahora es 400 (antes DEBIT implícito). Interfaz: selector con "Selecciona el tipo" sin valor por defecto. |
| D4-04 | Se conservan las reglas del servidor; el cliente no redondea ni en los mapeos ni al mostrar. | Ver "Precisión y cálculo". Corrección del 14 nov 2026: la vista "Ver", el listado y los precios de productos mostraban importes con `toFixed(2)` (redondeo no definido por el servidor); ahora muestran el valor exacto. Tarifa máxima y redondeo: pregunta PN-01, sin regla inventada. |
| D4-05 | Modificar líneas de una factura existente sigue exigiendo `invoice-items/manage`; `invoices/manage` no lo concede. | Sin ese permiso, al editar, líneas e impuestos quedan deshabilitados con una nota explicativa; cliente y vencimiento siguen editables. Crear una factura con sus líneas solo exige `invoices/manage`. |
| D4-06 | Vista de **solo lectura** de líneas e impuestos desde el listado, con `invoices/read`. | Acción "Ver" en cada fila → diálogo con `GET /invoices/:id`: cliente, fechas, estado, líneas, impuestos y totales del servidor. |

### Duplicados y datos históricos (D4-02, CA-13.8)

Consulta de solo lectura antes de cambiar el servidor (14 nov 2026):

| Base | Líneas | Impuestos | Líneas sin impuestos | Líneas con varios | Códigos repetidos en una línea | `kind` inválido | Códigos sin normalizar |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Desarrollo (`kali-invoice-db-dev`) | 12 | 7 | 5 | 0 | **0** | 0 | 0 |
| Cypress (`kali-invoice-cypress-db`) | — | — | — | — | **0** | 0 | — |

No hay duplicados que informar ni datos que corregir. La migración v9 (columna `position`) es
aditiva: las filas existentes quedan con 0 y no se modifican (los 7 impuestos de desarrollo se
conservan). Como ninguna línea histórica tiene más de un impuesto, su orden no cambia.

## Precisión y cálculo (D4-04)

Reglas del servidor (sin cambios en este incremento, salvo las validaciones de D4-02 y D4-03):

- `rate` es una **fracción** (`0.19` = 19 %), `>= 0`, **sin máximo**.
- `amount = subtotal × rate` en `float64` (IEEE-754 doble), **sin redondeo**.
- Total de impuestos de la línea = Σ DEBIT − Σ CREDIT en el orden de la lista; total de línea =
  subtotal + impuestos. Los totales de la factura los suma Postgres.
- Los impuestos se devuelven en el orden enviado (columna `position`, migración v9).

Interfaz:

- La tarifa se escribe en % con **punto decimal** y se convierte a fracción **desplazando el punto
  decimal sobre el texto** (`"0.414"` → `0.00414`; `0.00414` → `"0.414"`), sin `toFixed` ni
  multiplicar o dividir. Se eliminó el redondeo previo a 4 decimales.
- Los totales mostrados son los del servidor, sin recalcular **ni redondear**: `formatAmount`
  usa la representación decimal exacta del número recibido y solo completa ceros hasta 2
  decimales (`238` → `$238.00`; `0.41395799999999997` → `$0.41395799999999997`). Como el servidor
  calcula en `float64` sin redondeo, pueden verse decimales de coma flotante: es el valor real
  guardado, no un error de la interfaz. El valor también queda en `data-value`.
- Pruebas: Vitest `invoiceFormat.test.ts` (no recorta, conserva signo y artefactos de float) y
  CP-E2E-011 (el texto mostrado de totales e importes es igual al número del servidor).

**Pregunta de negocio pendiente PN-01 (no es una regla del sistema):** ¿tarifa máxima (p. ej.
≤ 100 %), número máximo de decimales en la tarifa y redondeo de importes (p. ej. a 2 decimales por
impuesto o por factura, y con qué método)? Hoy el servidor acepta cualquier tarifa ≥ 0 (la
comprobación EV02 C-15c aceptó 250 %) y guarda importes sin redondear; la interfaz no añade
límites. Si se decide una regla, debe implementarse en el servidor y reflejarse en la interfaz.

## Criterios de aceptación

| ID | Criterio | Evidencia |
| --- | --- | --- |
| CA-13.1 | Al crear una factura, cada línea admite **cero, uno o más** impuestos (agregar y quitar), cada uno con código, tipo y tarifa en %. Se guardan todos. | CP-INT-014, CP-E2E-011 (crear), GA10 2.4 |
| CA-13.2 | Al editar se muestran **todos** los impuestos de cada línea, en el orden guardado, con su tipo y su tarifa exacta. | CP-E2E-011 (editar), CP-INT-014 (reordenar), Go (posición), Vitest (`taxRate`) |
| CA-13.3 | Se puede cambiar, agregar o quitar cualquier impuesto; los no modificados se conservan. Guardar sin cambios **no** envía `PUT` de líneas. | CP-E2E-011, Vitest (`buildInvoiceItemUpdate`) |
| CA-13.4 | Subtotal, impuestos (débito suma, crédito resta) y total coinciden con los del servidor tras crear y tras editar. | CP-INT-014 (igualdad exacta por línea), CP-E2E-011 (`data-value`) |
| CA-13.5 | Validaciones en cliente y servidor (400) con mensajes en español: código obligatorio, sin repetir, tipo explícito, tarifa ≥ 0. | CP-INT-014, CP-E2E-011, Go, Vitest (esquema y `backendMessages`) |
| CA-13.6 | Facturas pagadas o canceladas: sus líneas e impuestos no se modifican (422). | CP-INT-014 |
| CA-13.7 | `invoices/manage` crea facturas con sus líneas; modificar líneas existentes exige `invoice-items/manage` (403 y nota en la interfaz); una línea de otra empresa → 404. | CP-INT-014, CP-E2E-011 (D4-05), CP-SEC-001 |
| CA-13.8 | Facturas existentes con 0, 1 o varios impuestos se abren y guardan sin perder, duplicar ni inventar impuestos. | CP-E2E-011 (guardar sin cambios), consulta de históricos |
| CA-13.9 | Pruebas Vitest, Go y Cypress (API y UI). | Ver "Verificación" |
| CA-13.10 | Vista de solo lectura desde el listado con `invoices/read`: líneas, impuestos ("Sin impuestos" si no hay) y totales del servidor. | CP-E2E-011 (D4-06) |

## Cambios

- **kali-invoice-service:** código normalizado y obligatorio, sin repetir en la línea; `kind`
  explícito; columna `position` (migración v9) y consultas ordenadas por `(position, id)`; pruebas
  de dominio y de mapeo; README con tarifas como fracción y reglas de validación y precisión.
- **invoice-kali-front:** editor de impuestos por línea (0..N), conversión % ↔ fracción exacta,
  validación zod en español, detección de cambios con la lista completa, modo de solo lectura de
  líneas sin `invoice-items/manage`, acción "Ver" con diálogo de solo lectura, traducción de
  `tax code is repeated in the same item` (y corrección de la clave de `tax kind must be DEBIT or
  CREDIT`, que nunca coincidía por estar en mayúsculas).
- **kali-invoice-tests:** CP-INT-014 (API), CP-E2E-011 (UI); GA10 adaptado (las líneas nuevas ya
  no traen IVA por defecto; acción "Ver" en la fila); `kind` obligatorio en el cliente de pruebas.

## Verificación

Verificaciones afectadas (14 nov 2026):

- kali-invoice-service: `go build`, `go vet` y `go test -count=1 ./...` correctos (9 paquetes con
  pruebas, incluidos los nuevos de dominio y de mapeo con posición).
- invoice-kali-front: `tsc -b`, `lint`, `build` correctos; Vitest **315/315** (14 archivos; nuevos:
  `taxRate`, esquema, mapeos; ampliados: `access`, `backendMessages`).
- kali-invoice-tests: `tsc --noEmit` correcto; en el entorno de desarrollo CP-INT-014 6/6 y
  CP-E2E-011 5/5.

**Regresión completa final, en una sola corrida** sobre una copia limpia de los cuatro
repositorios (`stack:up` desde cero con volúmenes nuevos, migraciones v1–v9 y semilla aplicadas):
**24 specs, 136/136 pruebas aprobadas** (API, UI, GA10 y semilla demo; 4 min 58 s), sin fallos ni
omisiones. Tras la corrida se restauró el entorno de desarrollo: `stack:health` correcto y los
volúmenes previos intactos.

## Limitaciones conocidas

- En modo de solo lectura (D4-05) el formulario sigue validando las líneas al guardar la cabecera:
  una línea histórica con códigos repetidos impediría guardar la cabecera a quien no tiene
  `invoice-items/manage`. Hoy no existe ninguna (ver históricos).
- Las acciones Editar, Cambiar estado y Cancelar del listado no se ocultan por permiso (el
  servidor responde 403); fuera del alcance de este incremento.
- Las líneas de una factura no tienen orden guardado (solo los impuestos); fuera del alcance.
- El menú actualiza sus permisos al volver a iniciar sesión, y facturación aplica cambios de
  permisos en hasta 5 s (caché de `/auth/session`), como en los incrementos anteriores.
