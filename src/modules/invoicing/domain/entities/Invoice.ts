import type { InvoiceId } from "@modules/invoicing/domain/value-objects/InvoiceId";
import type { InvoiceItem } from "@modules/invoicing/domain/entities/InvoiceItem";

export type InvoiceStatus = "PENDING" | "PAID" | "CANCELED";

export interface Invoice {
  id: InvoiceId;
  customerId: string;
  issueDate: Date | null;
  dueDate: Date | null;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  status: InvoiceStatus;
  createdAt: Date;
  updatedAt: Date;
}
