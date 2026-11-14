import type { InvoiceId } from "@modules/invoicing/domain/value-objects/InvoiceId";
import type { InvoiceItemId } from "@modules/invoicing/domain/value-objects/InvoiceItemId";
import type { InvoiceTax } from "@modules/invoicing/domain/entities/InvoiceTax";

export interface InvoiceItem {
  id: InvoiceItemId;
  invoiceId: InvoiceId;
  /** Identificador interno del producto (no se muestra al usuario). */
  itemId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxes: InvoiceTax[];
  taxTotal: number;
  subtotal: number;
  total: number;
}
