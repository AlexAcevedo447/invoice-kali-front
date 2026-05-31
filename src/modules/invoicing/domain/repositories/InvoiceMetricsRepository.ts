import type { InvoiceMetrics } from "@modules/invoicing/domain/entities/InvoiceMetrics";
import type { RequestOptions } from "@modules/invoicing/domain/repositories/RequestOptions";
export type { RequestOptions };

export interface InvoiceMetricsRepository {
  get(options?: RequestOptions): Promise<InvoiceMetrics>;
}
