import type {
  PublicRequest,
  InvoiceMetricsResult,
} from "../application/contracts";

export interface GetInvoicingMetricsPort {
  get(options?: PublicRequest): Promise<InvoiceMetricsResult>;
}
