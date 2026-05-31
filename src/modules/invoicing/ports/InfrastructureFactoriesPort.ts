import type {
  InvoiceApi,
  InvoiceItemApi,
  InvoiceTaxApi,
  InvoiceMetricsApi,
} from "@modules/invoicing/infrastructure/mappers/invoiceMapper";
import type { Invoice } from "@modules/invoicing/domain/entities/Invoice";
import type { InvoiceItem } from "@modules/invoicing/domain/entities/InvoiceItem";
import type { InvoiceTax } from "@modules/invoicing/domain/entities/InvoiceTax";
import type { InvoiceMetrics } from "@modules/invoicing/domain/entities/InvoiceMetrics";
import type {
  RequestOptions,
  IdempotentRequestOptions,
} from "@modules/invoicing/domain/repositories/RequestOptions";
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
