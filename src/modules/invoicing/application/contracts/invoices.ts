import type { Invoice } from "@modules/invoicing/domain/entities";

export interface ListInvoicesQuery {
  page?: number;
  pageSize?: number;
}

export interface GetInvoiceByIdQuery {
  id: string;
}

export interface CreateInvoiceCommand {
  customerId: string;
  issueDate?: string;
  dueDate?: string;
  items: Array<{
    itemId: string;
    quantity: number;
    unitPrice: number;
    taxes: Array<{ code: string; kind?: "DEBIT" | "CREDIT"; rate: number }>;
  }>;
}

export interface UpdateInvoiceCommand {
  id: string;
  customerId?: string;
  dueDate?: string;
}

export interface InvoiceStatusCommand {
  id: string;
}

export type InvoiceResult = Invoice;
export type InvoiceListResult = Invoice[];
