import type { InvoiceMetrics } from "../entities/InvoiceMetrics";
import type { RequestOptions } from "./RequestOptions";
export type { RequestOptions };

export interface InvoiceMetricsRepository {
  get(options?: RequestOptions): Promise<InvoiceMetrics>;
}
