import { z } from "zod";
import { parseEsCoDecimal } from "@shared/domain/esCoDecimal";

export const TAX_MESSAGES = {
  codeRequired: "El código del impuesto es obligatorio.",
  kindRequired: "Selecciona el tipo de impuesto (débito o crédito).",
  rateRequired: "La tarifa del impuesto es obligatoria.",
  rateNegative: "La tarifa del impuesto no puede ser negativa.",
  codeRepeated: (code: string) => `El código de impuesto "${code}" está repetido en esta línea.`,
} as const;

/**
 * Clave con la que el servidor compara códigos de impuesto (lo normaliza con
 * trim + mayúsculas antes de guardarlo y de comprobar repetidos).
 */
export const taxCodeKey = (code: string): string => code.trim().toUpperCase();

export const ITEM_MESSAGES = {
  quantityRequired: "La cantidad es obligatoria.",
  quantityRange: "Quantity must be > 0",
  unitPriceRequired: "El precio unitario es obligatorio.",
  unitPriceRange: "Unit price must be > 0",
} as const;

/**
 * Campo decimal es-CO (coma decimal, sin separadores de miles). El valor se
 * conserva como el TEXTO que escribió el usuario; los mappers lo convierten
 * con el mismo parser, de forma exacta. Primero se informa el formato y luego
 * el rango, para que "1.5" nunca se lea como otro número.
 */
const esCoDecimalText = (requiredMessage: string, rangeError: (value: number) => string | null) =>
  z
    .string({ error: requiredMessage })
    .trim()
    .superRefine((text, ctx) => {
      if (text === "") {
        ctx.addIssue({ code: "custom", message: requiredMessage });
        return;
      }
      const parsed = parseEsCoDecimal(text);
      if (!parsed.ok) {
        ctx.addIssue({ code: "custom", message: parsed.error });
        return;
      }
      const message = rangeError(parsed.value);
      if (message) ctx.addIssue({ code: "custom", message });
    });

export const taxSchema = z.object({
  code: z.string().trim().min(1, TAX_MESSAGES.codeRequired),
  kind: z
    .enum(["", "DEBIT", "CREDIT"], { error: TAX_MESSAGES.kindRequired })
    // Sin predicado de tipo: el formulario admite "" (sin elegir) hasta validar.
    .refine((kind) => kind.length > 0, TAX_MESSAGES.kindRequired),
  // Se conserva como texto (el % que escribió el usuario, con coma decimal)
  // para convertirlo a fracción sin redondeos ni artefactos binarios (ver taxRate.ts).
  rate: esCoDecimalText(TAX_MESSAGES.rateRequired, (percent) => (percent < 0 ? TAX_MESSAGES.rateNegative : null)),
});

/**
 * 0..N impuestos por línea (D4-01: una línea puede no tener impuestos). El
 * código no puede repetirse en la misma línea sin distinguir mayúsculas ni
 * espacios exteriores (el servidor responde 400 "tax code is repeated in the
 * same item"); el error se marca en la fila repetida.
 */
export const taxesSchema = z.array(taxSchema).superRefine((taxes, ctx) => {
  const seen = new Set<string>();
  taxes.forEach((tax, index) => {
    const key = taxCodeKey(typeof tax?.code === "string" ? tax.code : "");
    if (!key) return;
    if (seen.has(key)) {
      ctx.addIssue({ code: "custom", path: [index, "code"], message: TAX_MESSAGES.codeRepeated(key) });
      return;
    }
    seen.add(key);
  });
});

export const itemSchema = z.object({
  // Id de la línea ya guardada (invoice-items); vacío en líneas nuevas.
  lineId: z.string().optional(),
  // El producto se elige en el catálogo; el UUID es solo el valor interno.
  itemId: z.string().min(1, "Selecciona un producto"),
  // Texto es-CO ("2,5"); los mappers lo convierten a número exacto.
  quantity: esCoDecimalText(ITEM_MESSAGES.quantityRequired, (value) =>
    value > 0 ? null : ITEM_MESSAGES.quantityRange,
  ),
  unitPrice: esCoDecimalText(ITEM_MESSAGES.unitPriceRequired, (value) =>
    value > 0 ? null : ITEM_MESSAGES.unitPriceRange,
  ),
  taxes: taxesSchema,
});

export const createInvoiceSchema = z
  .object({
    customerId: z.string().min(1, "Selecciona un cliente"),
    issueDate: z.string().optional(),
    dueDate: z.string().optional(),
    items: z.array(itemSchema).min(1, "At least one item is required"),
  })
  // El backend rechaza due_date anterior a issue_date.
  .refine(
    (values) =>
      !values.issueDate ||
      !values.dueDate ||
      new Date(values.dueDate).getTime() >= new Date(values.issueDate).getTime(),
    { path: ["dueDate"], message: "Due date must be on or after issue date" },
  );

export type CreateInvoiceFormValues = z.infer<typeof createInvoiceSchema>;
export type InvoiceFormItem = CreateInvoiceFormValues["items"][number];
export type InvoiceFormTax = InvoiceFormItem["taxes"][number];
