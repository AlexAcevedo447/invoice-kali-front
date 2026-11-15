# Incremento 4 — Impuestos múltiples por línea (RF-13)

Estado: **implementado y probado (14 nov 2026)** en la rama `feature/impuestos` (creada desde
`feature/usuarios`) de los cuatro repositorios. D4-04 está resuelta: se conservan las reglas del
servidor y el cliente no redondea valores ni cálculos (los importes se presentan con 2 decimales
solo como formato visual). PN-01 (sin tarifa máxima adicional ni redondeo en cálculos) es una
**limitación aceptada** para este alcance. Ver también "Cierre de hallazgos de la evidencia
AA3-EV02".

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
| D4-04 | Se conservan las reglas del servidor; el cliente no redondea valores, mapeos ni cálculos. | Ver "Precisión y cálculo". Los importes se **presentan** con 2 decimales en formato es-CO solo como formato visual; API, almacenamiento, cálculos y `data-value` conservan el valor original. PN-01: limitación aceptada. |
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

- **Entrada numérica es-CO** (cantidad, precio unitario, tarifa en % y precio de producto): solo
  dígitos y una **coma decimal**, sin separadores de miles (`1,5`, `150000`, `19,5`, `0,414`). Un
  punto, varias comas u otros caracteres se rechazan con un mensaje claro; nunca se reinterpreta el
  valor. Los campos son de texto (`inputMode="decimal"`) para que el navegador no descarte la coma.
- La tarifa en % se convierte a fracción **desplazando la coma decimal sobre el texto**
  (`"0,414"` → `0.00414`; `0.00414` → `"0,414"`), sin multiplicar, dividir ni redondear.
- Los totales mostrados son los del servidor, sin recalcular. `formatAmount` los **presenta** con 2
  decimales en formato es-CO (`$1.863,00` para 1862.9999999999998): es solo formato visual; el valor
  original queda intacto en la API, el almacenamiento, los cálculos y `data-value`.

**PN-01 — Limitación aceptada (14 nov 2026):** para este alcance se conserva la ausencia de tarifa
máxima adicional (cualquier tarifa ≥ 0; la comprobación EV02 C-15c aceptó 250 %) y de redondeo en
los cálculos (importes en `float64` sin redondear). No bloquea la entrega y **no acredita
cumplimiento tributario**: definir topes y reglas de redondeo exigidos por la normativa queda fuera
de este alcance.

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
- PN-01 (limitación aceptada): sin tarifa máxima adicional ni redondeo en cálculos; no acredita
  cumplimiento tributario.

## Cierre de hallazgos de la evidencia AA3-EV02 (14 nov 2026)

| Hallazgo | Corrección | Pruebas de regresión |
| --- | --- | --- |
| M-02: "1,5" en cantidad o precio quedaba como 15 sin aviso (campo numérico del navegador). | Entrada es-CO en cantidad, precio unitario, tarifa y precio de producto: campos de texto (`inputMode="decimal"`), solo dígitos y **una coma decimal**, sin separadores de miles. Punto, varias comas u otros caracteres → mensaje claro; el texto escrito o pegado se conserva tal cual, nunca se reinterpreta. Al editar se muestran con coma ("1,5", "0,414"). | Vitest `esCoDecimal` (63), esquema y mapeos; CP-E2E-012 (escritura y pegado: `1.5`, `1.234,56`, `150.000`, `1,2,3`, `$150`, `1 234`, `1e3`; `1,5`/`100,25`/`19,5` llegan exactos al servidor y se reabren igual). |
| Presentación monetaria con artefactos de coma flotante (`$1862.9999999999998`). | `formatAmount`: formato **visual** es-CO con 2 decimales (`$1.863,00`). API, almacenamiento, cálculos y `data-value` conservan el valor original. Tarifas en la vista: "2,5 %". | Vitest `invoiceFormat` (23); CP-E2E-011 (texto = formato de 2 decimales del `data-value`); CP-E2E-012; GA10 (montos y orden por `data-value`). |
| M-08: la contraseña mínima de 12 se medía en bytes (11 caracteres con ñ/tilde/emoji se aceptaban). | Servidor: `utf8.RuneCountInString`. Interfaz: misma política (`[...pw].length`, `\p{Lu}`, `\p{Ll}`, `\p{Nd}`, `[\p{P}\p{S}]`, sin `\p{White_Space}`) con los mismos mensajes. Contraseñas existentes sin cambios (la política no se aplica al iniciar sesión). Argon2id usa la contraseña completa; bcrypt solo verifica hashes heredados (límite efectivo de 72 bytes; 0 en desarrollo). | Go `password_policy_test.go`, `password_hasher_test.go`; Vitest `userForm.schema`; CP-INT-015 (API, incl. > 72 bytes); CP-E2E-012 (interfaz). |
| M-03/M-06: nombres largos sin espacios desbordaban el selector; listado y menú desbordaban la página en móvil y tableta. | Hoja `src/app/styles/global.css`: cabecera y navegación con ajuste de línea, tablas con desplazamiento dentro de su contenedor, celdas y opciones con corte de palabras largas, panel del selector limitado al ancho de la pantalla. | CP-E2E-012 (390×844 y 768×1024: sin desbordamiento de página en facturas, clientes, productos, usuarios, roles y permisos; enlaces y "Cerrar sesión" dentro de la pantalla; opción y panel del selector dentro de la pantalla). |
| PN-01 | Limitación aceptada (ver "Precisión y cálculo"). | — |
