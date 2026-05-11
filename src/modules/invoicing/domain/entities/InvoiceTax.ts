import type { InvoiceId } from "../value-objects/InvoiceId";
import type { InvoiceItemId } from "../value-objects/InvoiceItemId";
import type { InvoiceTaxId } from "../value-objects/InvoiceTaxId";

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
