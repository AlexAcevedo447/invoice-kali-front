import type { Invoice } from "@modules/invoicing/domain/entities/Invoice";
import type { InvoiceItem } from "@modules/invoicing/domain/entities/InvoiceItem";
import type { InvoiceTaxKind } from "@modules/invoicing/domain/entities/InvoiceTax";
import { percentToRate, rateToPercent } from "@modules/invoicing/domain/value-objects/taxRate";
import { dotDecimalToEsCo, formatEsCoDecimal, parseEsCoDecimal } from "@shared/domain/esCoDecimal";
import {
  taxCodeKey,
  type CreateInvoiceFormValues,
  type InvoiceFormItem,
  type InvoiceFormTax,
} from "@modules/invoicing/ui/forms/CreateInvoiceForm/createInvoiceForm.schema";

/** Impuesto tal como lo espera el servidor: tarifa como fracción (0.19 = 19 %). */
export interface TaxCommand {
  code: string;
  kind: InvoiceTaxKind;
  rate: number;
}

export const toIsoOrUndefined = (value?: string): string | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

export const toDateTimeLocalValue = (value?: Date | string | null): string => {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Texto es-CO ya validado ("2,5") → número exacto. Lanza un error si el texto
 * no es válido (la validación del formulario lo impide antes).
 */
export const esCoTextToNumber = (text: string): number => {
  const parsed = parseEsCoDecimal(text);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value;
};

/** % es-CO del formulario ("4,14") → fracción exacta para el servidor (0.0414). */
export const percentTextToRate = (text: string): number => {
  const parsed = parseEsCoDecimal(text);
  if (!parsed.ok) throw new Error(parsed.error);
  return percentToRate(parsed.canonical);
};

/** Fracción del servidor (0.0414) → % es-CO exacto para el formulario o la vista ("4,14"). */
export const rateToPercentText = (rate: number): string => dotDecimalToEsCo(rateToPercent(rate));

/** Fila de impuesto nueva: sin código, sin tipo (el usuario lo elige) y sin tarifa. */
export const createEmptyTax = (): InvoiceFormTax => ({ code: "", kind: "", rate: "" });

/** Línea nueva: empieza SIN impuestos (no se inventa un IVA por defecto). */
export const createEmptyItem = (): InvoiceFormItem => ({
  itemId: "",
  quantity: "1",
  // "0" (no vacío): al enviar sin producto se informa "Unit price must be > 0".
  unitPrice: "0",
  taxes: [],
});

export const getCreateInvoiceDefaultValues = (): CreateInvoiceFormValues => ({
  customerId: "",
  issueDate: "",
  dueDate: "",
  items: [createEmptyItem()],
});

/**
 * Factura guardada → formulario. Se muestran TODOS los impuestos de cada línea,
 * en el orden guardado, con la tarifa en % exacta. Cantidad, precio y tarifa se
 * muestran como texto es-CO exacto (coma decimal, sin agrupar ni redondear). Una línea sin impuestos
 * queda sin impuestos (no se le inventa un "IVA 0 %").
 */
export const mapInvoiceToCreateInvoiceFormValues = (
  invoice: Invoice,
): CreateInvoiceFormValues => ({
  customerId: invoice.customerId,
  issueDate: toDateTimeLocalValue(invoice.issueDate),
  dueDate: toDateTimeLocalValue(invoice.dueDate),
  items:
    invoice.items.length > 0
      ? invoice.items.map((item) => ({
          lineId: String(item.id),
          itemId: item.itemId,
          quantity: formatEsCoDecimal(item.quantity),
          unitPrice: formatEsCoDecimal(item.unitPrice),
          taxes: item.taxes.map((tax) => ({
            code: tax.code,
            kind: tax.kind,
            rate: rateToPercentText(tax.rate),
          })),
        }))
      : [createEmptyItem()],
});

/**
 * Impuestos del formulario (ya validados) → lista para el servidor. Se envía el
 * código sin espacios exteriores (el servidor además lo pasa a mayúsculas) y la
 * tarifa como fracción exacta.
 */
export const mapFormTaxesToCommand = (taxes: InvoiceFormTax[]): TaxCommand[] =>
  taxes.map((tax) => {
    if (tax.kind !== "DEBIT" && tax.kind !== "CREDIT") {
      throw new Error("El tipo de impuesto debe ser débito o crédito.");
    }
    return { code: tax.code.trim(), kind: tax.kind, rate: percentTextToRate(tax.rate) };
  });

/** Forma comparable de una lista de impuestos (igual que la normaliza el servidor). */
const normalizeTaxes = (taxes: TaxCommand[]): TaxCommand[] =>
  taxes.map((tax) => ({ code: taxCodeKey(tax.code), kind: tax.kind, rate: tax.rate }));

/** true si las dos listas tienen los mismos impuestos (código normalizado, tipo y tarifa exacta) en el mismo orden. */
export const sameTaxes = (left: TaxCommand[], right: TaxCommand[]): boolean => {
  const a = normalizeTaxes(left);
  const b = normalizeTaxes(right);
  return (
    a.length === b.length &&
    a.every((tax, index) => tax.code === b[index].code && tax.kind === b[index].kind && tax.rate === b[index].rate)
  );
};

/**
 * Cambio de una línea guardada para `PUT /invoice-items/:id`, o null si no
 * cambió nada (cantidad, precio unitario y la lista COMPLETA de impuestos en
 * orden). El PUT reemplaza la lista de impuestos, así que se envía completa:
 * quitar un impuesto también es un cambio.
 */
export const buildInvoiceItemUpdate = (
  before: InvoiceItem,
  item: InvoiceFormItem,
): { id: string; quantity: number; unitPrice: number; taxes: TaxCommand[] } | null => {
  const taxes = mapFormTaxesToCommand(item.taxes);
  // Comparación numérica exacta: "2,50" y 2.5 son el mismo valor (no hay PUT).
  const quantity = esCoTextToNumber(item.quantity);
  const unitPrice = esCoTextToNumber(item.unitPrice);
  const changed =
    before.quantity !== quantity ||
    before.unitPrice !== unitPrice ||
    !sameTaxes(
      before.taxes.map((tax) => ({ code: tax.code, kind: tax.kind, rate: tax.rate })),
      taxes,
    );
  if (!changed) return null;
  return { id: String(before.id), quantity, unitPrice, taxes };
};

export const mapCreateInvoiceFormValuesToCreateCommand = (
  values: CreateInvoiceFormValues,
) => ({
  customerId: values.customerId,
  issueDate: toIsoOrUndefined(values.issueDate),
  dueDate: toIsoOrUndefined(values.dueDate),
  items: values.items.map((item) => ({
    itemId: item.itemId,
    quantity: esCoTextToNumber(item.quantity),
    unitPrice: esCoTextToNumber(item.unitPrice),
    taxes: mapFormTaxesToCommand(item.taxes),
  })),
});

export const mapCreateInvoiceFormValuesToUpdateCommand = (
  values: CreateInvoiceFormValues,
  invoiceId: string,
) => ({
  id: invoiceId,
  customerId: values.customerId,
  dueDate: toIsoOrUndefined(values.dueDate),
});
