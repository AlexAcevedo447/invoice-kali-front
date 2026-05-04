import type {
  InvoiceId,
  InvoiceItemId,
} from "@modules/invoicing/domain/value-objects";
import type { InvoiceTax } from "./InvoiceTax";

export interface InvoiceItem {
  id: InvoiceItemId;
  invoiceId: InvoiceId;
  itemId: string;
  quantity: number;
  unitPrice: number;
  taxes: InvoiceTax[];
  taxTotal: number;
  subtotal: number;
  total: number;
}
