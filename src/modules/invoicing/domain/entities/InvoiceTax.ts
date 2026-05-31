import type { InvoiceId } from "@modules/invoicing/domain/value-objects/InvoiceId";
import type { InvoiceItemId } from "@modules/invoicing/domain/value-objects/InvoiceItemId";
import type { InvoiceTaxId } from "@modules/invoicing/domain/value-objects/InvoiceTaxId";

export type InvoiceTaxKind = "DEBIT" | "CREDIT";

export interface InvoiceTax {
  id: InvoiceTaxId;
  invoiceId: InvoiceId;
  invoiceItemId: InvoiceItemId;
  code: string;
  kind: InvoiceTaxKind;
  rate: number;
  amount: number;
}
