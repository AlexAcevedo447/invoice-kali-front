import type { InvoiceStatus as DomainInvoiceStatus } from "@modules/invoicing/domain/entities/Invoice";
import type { InvoiceTaxKind } from "@modules/invoicing/domain/entities/InvoiceTax";
import type { InvoiceStatus } from "./invoiceStatus";

/**
 * Formato de importes en pantalla (el mismo de la columna Monto del listado).
 * Solo cambia cómo se muestra: el valor guardado no se redondea.
 */
export const formatAmount = (amount: number): string => `$${amount.toFixed(2)}`;

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
