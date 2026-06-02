import type {
  InvoiceApi,
  InvoiceItemApi,
  InvoiceTaxApi,
  InvoiceMetricsApi,
} from "../infrastructure/mappers/invoiceMapper";
import type { Invoice } from "../domain/entities/Invoice";
import type { InvoiceItem } from "../domain/entities/InvoiceItem";
import type { InvoiceTax } from "../domain/entities/InvoiceTax";
import type { InvoiceMetrics } from "../domain/entities/InvoiceMetrics";
import type {
  RequestOptions,
  IdempotentRequestOptions,
} from "../domain/repositories/RequestOptions";
import type { HttpRequestConfig } from "@shared/application/http/HttpClient";

export interface InvoiceMapperPort {
  mapInvoiceApiToDomain: (input: InvoiceApi) => Invoice;
  mapInvoiceItemApiToDomain: (input: InvoiceItemApi) => InvoiceItem;
  mapInvoiceTaxApiToDomain: (input: InvoiceTaxApi) => InvoiceTax;
  mapInvoiceMetricsApiToDomain: (input: InvoiceMetricsApi) => InvoiceMetrics;
}

export interface HttpConfigPort {
  toPublicConfig: (options?: RequestOptions) => HttpRequestConfig | undefined;
  toIdempotentConfig: (options: IdempotentRequestOptions) => HttpRequestConfig;
}
