import type {
  InvoiceId,
  InvoiceItemId,
  InvoiceTaxId,
} from "@modules/invoicing/domain/value-objects";

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
