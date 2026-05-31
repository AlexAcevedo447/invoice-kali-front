import type {
  PublicRequest,
  InvoiceMetricsResult,
} from "@modules/invoicing/application/contracts";

export interface GetInvoicingMetricsPort {
  get(options?: PublicRequest): Promise<InvoiceMetricsResult>;
}
