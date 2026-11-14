import type { InvoiceStatus as DomainInvoiceStatus } from "@modules/invoicing/domain/entities/Invoice";
import type { InvoiceTaxKind } from "@modules/invoicing/domain/entities/InvoiceTax";
import { shiftDecimalPoint } from "@modules/invoicing/domain/value-objects/taxRate";
import type { InvoiceStatus } from "./invoiceStatus";

/**
 * Formato de importes en pantalla (D4-04): muestra el valor del servidor SIN
 * redondear. El servidor no define redondeo (importe = subtotal × tarifa en
 * float64), así que el cliente no inventa uno: usa la representación decimal
 * exacta del número recibido y solo completa con ceros hasta 2 decimales
 * (238 → "$238.00"; 0.413958 → "$0.413958"). Nunca recorta decimales.
 */
export const formatAmount = (amount: number): string => {
    const exact = shiftDecimalPoint(String(amount), 0);
    const negative = exact.startsWith("-");
    const [integer, fraction = ""] = (negative ? exact.slice(1) : exact).split(".");
    return `${negative ? "-" : ""}$${integer}.${fraction.padEnd(2, "0")}`;
};

export const TAX_KIND_LABELS: Record<InvoiceTaxKind, string> = {
    DEBIT: "Débito",
    CREDIT: "Crédito",
};

const STATUS_TO_UI: Record<DomainInvoiceStatus, InvoiceStatus> = {
    PENDING: "pending",
    PAID: "paid",
    CANCELED: "cancelled",
};

export const mapDomainStatusToUI = (status: string): InvoiceStatus =>
    STATUS_TO_UI[status as DomainInvoiceStatus] ?? "draft";
