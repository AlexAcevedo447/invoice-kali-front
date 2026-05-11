import type { Invoice } from "@modules/invoicing/domain/entities/Invoice";

export interface InvoiceQueryPort {
  list(): Promise<Invoice[]>;
}
