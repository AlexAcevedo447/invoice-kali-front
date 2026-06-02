export interface InvoiceMetrics {
  invoicesCreated: number;
  invoicesPaid: number;
  invoicesCanceled: number;
  invoiceItemsCreated: number;
  invoiceItemsUpdated: number;
  invoiceItemsDeleted: number;
  rabbitEventsPublished: number;
  rabbitEventsFailed: number;
  idempotencyHits: number;
  idempotencyMisses: number;
}
