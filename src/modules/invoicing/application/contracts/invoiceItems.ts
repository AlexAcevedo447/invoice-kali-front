import type { InvoiceItem } from "@modules/invoicing/domain/entities/InvoiceItem";

export interface ListInvoiceItemsQuery {
  page?: number;
  pageSize?: number;
}

export interface GetInvoiceItemByIdQuery {
  id: string;
}

export interface CreateInvoiceItemCommand {
  invoiceId: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  taxes: Array<{ code: string; kind?: "DEBIT" | "CREDIT"; rate: number }>;
}

export interface UpdateInvoiceItemCommand {
  id: string;
  quantity: number;
  unitPrice: number;
  taxes: Array<{ code: string; kind?: "DEBIT" | "CREDIT"; rate: number }>;
}

export interface DeleteInvoiceItemCommand {
  id: string;
}

export type InvoiceItemResult = InvoiceItem;
export type InvoiceItemListResult = InvoiceItem[];
