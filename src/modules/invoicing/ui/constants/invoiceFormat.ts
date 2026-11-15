import type { InvoiceStatus as DomainInvoiceStatus } from "@modules/invoicing/domain/entities/Invoice";
import type { InvoiceTaxKind } from "@modules/invoicing/domain/entities/InvoiceTax";
import { rateToPercent } from "@modules/invoicing/domain/value-objects/taxRate";
import { dotDecimalToEsCo } from "@shared/domain/esCoDecimal";
import type { InvoiceStatus } from "./invoiceStatus";

const AMOUNT_FORMAT = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/**
 * Formato VISUAL de importes en pantalla: estilo es-CO con separador de miles
 * (punto), coma decimal y exactamente 2 decimales, con prefijo "$"
 * (238 -> "$238,00"; 3684.43 -> "$3.684,43"; -25 -> "-$25,00").
 *
 * Solo cambia el texto que se muestra: los valores guardados, los que envía el
 * servidor y los cálculos no se tocan (cada importe conserva el número exacto
 * del servidor en su atributo `data-value`).
 */
export const formatAmount = (amount: number): string => {
    const text = AMOUNT_FORMAT.format(Math.abs(amount));
    // Un importe que se muestra como 0,00 no lleva signo ("-$0,00" confunde).
    const negative = amount < 0 && /[1-9]/.test(text);
    return `${negative ? "-" : ""}$${text}`;
};

/**
 * Tarifa del servidor (fracción) -> porcentaje exacto con coma decimal:
 * 0.025 -> "2,5 %"; 0.00414 -> "0,414 %". Sin redondeo.
 */
export const formatRatePercent = (rate: number): string => `${dotDecimalToEsCo(rateToPercent(rate))} %`;

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
