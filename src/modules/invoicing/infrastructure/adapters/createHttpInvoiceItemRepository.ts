import type { InvoiceItemRepository } from "@modules/invoicing/domain/repositories/InvoiceItemRepository";
import type { HttpClient } from "@shared/infrastructure/http/HttpClient";
import type { EndpointRegistryContext } from "@app/api/EndpointRegistry";
import { resolveEndpoint } from "@app/api/EndpointRegistry";
import {
  toIdempotentConfig,
  toPublicConfig,
} from "@modules/invoicing/infrastructure/adapters/httpConfig";
import { mapInvoiceItemApiToDomain } from "@modules/invoicing/infrastructure/mappers/invoiceMapper";

type InvoiceItemApi = import("../mappers/invoiceMapper").InvoiceItemApi;

export interface CreateHttpInvoiceItemRepositoryDeps {
  httpClient: HttpClient;
  endpointRegistry: EndpointRegistryContext;
}

export function createHttpInvoiceItemRepository({
  httpClient,
  endpointRegistry,
}: CreateHttpInvoiceItemRepositoryDeps): InvoiceItemRepository {
  return {
    async list(query, options) {
      const { invoices } = await resolveEndpoint(endpointRegistry, "invoices");
      const response = await httpClient.get<InvoiceItemApi[]>(
        invoices.invoiceItemsList(query.page ?? 1, query.pageSize ?? 20),
        toPublicConfig(options),
      );
      return response.map(mapInvoiceItemApiToDomain);
    },
    async getById(id, options) {
      const { invoices } = await resolveEndpoint(endpointRegistry, "invoices");
      const response = await httpClient.get<InvoiceItemApi>(
        invoices.invoiceItemsGetById(id),
        toPublicConfig(options),
      );
      return mapInvoiceItemApiToDomain(response);
    },
    async create(command, options) {
      const { invoices } = await resolveEndpoint(endpointRegistry, "invoices");
      const response = await httpClient.post<
        InvoiceItemApi,
        {
          invoice_id: string;
          item_id: string;
          quantity: number;
          unit_price: number;
          taxes: Array<{
            code: string;
            kind?: "DEBIT" | "CREDIT";
            rate: number;
          }>;
        }
      >(
        invoices.invoiceItemsCreate,
        {
          invoice_id: command.invoiceId,
          item_id: command.itemId,
          quantity: command.quantity,
          unit_price: command.unitPrice,
          taxes: command.taxes,
        },
        toIdempotentConfig(options),
      );
      return mapInvoiceItemApiToDomain(response);
    },
    async update(command, options) {
      const { invoices } = await resolveEndpoint(endpointRegistry, "invoices");
      const response = await httpClient.put<
        InvoiceItemApi,
        {
          quantity: number;
          unit_price: number;
          taxes: Array<{
            code: string;
            kind?: "DEBIT" | "CREDIT";
            rate: number;
          }>;
        }
      >(
        invoices.invoiceItemsUpdate(command.id),
        {
          quantity: command.quantity,
          unit_price: command.unitPrice,
          taxes: command.taxes,
        },
        toIdempotentConfig(options),
      );
      return mapInvoiceItemApiToDomain(response);
    },
    async delete(id, options) {
      const { invoices } = await resolveEndpoint(endpointRegistry, "invoices");
      await httpClient.delete<void>(
        invoices.invoiceItemsDelete(id),
        toIdempotentConfig(options),
      );
    },
  };
}
