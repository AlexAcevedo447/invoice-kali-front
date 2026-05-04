import type {
  Invoice,
  InvoiceItem,
  InvoiceMetrics,
  InvoiceTax,
} from "@modules/invoicing/domain/entities";
import {
  toInvoiceId,
  toInvoiceItemId,
  toInvoiceTaxId,
} from "@modules/invoicing/domain/value-objects";

export interface InvoiceTaxApi {
  ID: string;
  InvoiceID: string;
  InvoiceItemID: string;
  Code: string;
  Kind?: "DEBIT" | "CREDIT";
  Rate: number;
  Amount: number;
}

export interface InvoiceItemApi {
  ID: string;
  InvoiceID: string;
  ItemID: string;
  Quantity: number;
  UnitPrice: number;
  Taxes: InvoiceTaxApi[];
  TaxTotal: number;
  Subtotal: number;
  Total: number;
}

export interface InvoiceApi {
  ID: string;
  CustomerID: string;
  IssueDate?: string;
  DueDate?: string;
  Items: InvoiceItemApi[];
  Subtotal: number;
  TaxTotal: number;
  Total: number;
  Status: "PENDING" | "PAID" | "CANCELED";
  CreatedAt: string;
  UpdatedAt: string;
}

export interface InvoiceMetricsApi {
  invoices_created: number;
  invoices_paid: number;
  invoices_canceled: number;
  invoice_items_created: number;
  invoice_items_updated: number;
  invoice_items_deleted: number;
  rabbit_events_published: number;
  rabbit_events_failed: number;
  idempotency_hits: number;
  idempotency_misses: number;
}

export const mapInvoiceTaxApiToDomain = (input: InvoiceTaxApi): InvoiceTax => ({
  id: toInvoiceTaxId(input.ID),
  invoiceId: toInvoiceId(input.InvoiceID),
  invoiceItemId: toInvoiceItemId(input.InvoiceItemID),
  code: input.Code,
  kind: input.Kind ?? "DEBIT",
  rate: input.Rate,
  amount: input.Amount,
});

export const mapInvoiceItemApiToDomain = (
  input: InvoiceItemApi,
): InvoiceItem => ({
  id: toInvoiceItemId(input.ID),
  invoiceId: toInvoiceId(input.InvoiceID),
  itemId: input.ItemID,
  quantity: input.Quantity,
  unitPrice: input.UnitPrice,
  taxes: input.Taxes.map(mapInvoiceTaxApiToDomain),
  taxTotal: input.TaxTotal,
  subtotal: input.Subtotal,
  total: input.Total,
});

export const mapInvoiceApiToDomain = (input: InvoiceApi): Invoice => ({
  id: toInvoiceId(input.ID),
  customerId: input.CustomerID,
  issueDate: input.IssueDate ? new Date(input.IssueDate) : null,
  dueDate: input.DueDate ? new Date(input.DueDate) : null,
  items: input.Items.map(mapInvoiceItemApiToDomain),
  subtotal: input.Subtotal,
  taxTotal: input.TaxTotal,
  total: input.Total,
  status: input.Status,
  createdAt: new Date(input.CreatedAt),
  updatedAt: new Date(input.UpdatedAt),
});

export const mapInvoiceMetricsApiToDomain = (
  input: InvoiceMetricsApi,
): InvoiceMetrics => ({
  invoicesCreated: input.invoices_created,
  invoicesPaid: input.invoices_paid,
  invoicesCanceled: input.invoices_canceled,
  invoiceItemsCreated: input.invoice_items_created,
  invoiceItemsUpdated: input.invoice_items_updated,
  invoiceItemsDeleted: input.invoice_items_deleted,
  rabbitEventsPublished: input.rabbit_events_published,
  rabbitEventsFailed: input.rabbit_events_failed,
  idempotencyHits: input.idempotency_hits,
  idempotencyMisses: input.idempotency_misses,
});
