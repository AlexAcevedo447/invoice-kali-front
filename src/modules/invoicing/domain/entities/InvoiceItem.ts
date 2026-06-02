import type { InvoiceId } from "../value-objects/InvoiceId";
import type { InvoiceItemId } from "../value-objects/InvoiceItemId";
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
