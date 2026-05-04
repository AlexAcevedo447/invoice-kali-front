import type { InvoiceMetrics } from "@modules/invoicing/domain/entities";
import type { RequestOptions } from "@modules/invoicing/domain/repositories/RequestOptions";

export interface InvoiceMetricsRepository {
  get(options?: RequestOptions): Promise<InvoiceMetrics>;
}
