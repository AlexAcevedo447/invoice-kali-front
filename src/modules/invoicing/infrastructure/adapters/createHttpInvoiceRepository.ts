// Archivo renombrado desde useHttpInvoiceRepository.ts
// Refactorizado para factory pura con dependencias explícitas

import type { InvoiceRepository } from "@modules/invoicing/domain/repositories/InvoiceRepository";
import type { HttpClient } from "@shared/infrastructure/http/HttpClient";
import type { EndpointRegistryContext } from "@app/api/EndpointRegistry";
import { resolveEndpoint } from "@app/api/EndpointRegistry";
import {
  toIdempotentConfig,
  toPublicConfig,
} from "@modules/invoicing/infrastructure/adapters/httpConfig";
import { mapInvoiceApiToDomain } from "@modules/invoicing/infrastructure/mappers/invoiceMapper";

type InvoiceApi = import("../mappers/invoiceMapper").InvoiceApi;

export interface CreateHttpInvoiceRepositoryDeps {
  httpClient: HttpClient;
  endpointRegistry: EndpointRegistryContext;
}

export function createHttpInvoiceRepository({
  httpClient,
  endpointRegistry,
}: CreateHttpInvoiceRepositoryDeps): InvoiceRepository {
  return {
    async list(query, options) {
      const { invoices } = await resolveEndpoint(endpointRegistry, "invoices");
      const response = await httpClient.get<InvoiceApi[]>(
        invoices.listPaginated(query.page ?? 1, query.pageSize ?? 20),
        toPublicConfig(options),
      );
      return response.map(mapInvoiceApiToDomain);
    },
    async findAll(options) {
      return this.list({ page: 1, pageSize: 20 }, options);
    },
    async getById(id, options) {
      const { invoices } = await resolveEndpoint(endpointRegistry, "invoices");
      const response = await httpClient.get<InvoiceApi>(
        invoices.getById(id),
        toPublicConfig(options),
      );
      return mapInvoiceApiToDomain(response);
    },
    async findById(id, options) {
      try {
        return await this.getById(id, options);
      } catch {
        return null;
      }
    },
    async create(command, options) {
      const { invoices } = await resolveEndpoint(endpointRegistry, "invoices");
      const response = await httpClient.post<
        InvoiceApi,
        {
          customerId: string;
          issueDate?: string;
          dueDate?: string;
          items: Array<{
            itemId: string;
            quantity: number;
            unitPrice: number;
            taxes: Array<{
              code: string;
              kind?: "DEBIT" | "CREDIT";
              rate: number;
            }>;
          }>;
        }
      >(invoices.create, command, toIdempotentConfig(options));
      return mapInvoiceApiToDomain(response);
    },
    async update(command, options) {
      const { invoices } = await resolveEndpoint(endpointRegistry, "invoices");
      const response = await httpClient.put<
        InvoiceApi,
        {
          id: string;
          customerId?: string;
          dueDate?: string;
        }
      >(invoices.update(command.id), command, toIdempotentConfig(options));
      return mapInvoiceApiToDomain(response);
    },
    async pay(id, options) {
      const { invoices } = await resolveEndpoint(endpointRegistry, "invoices");
      const response = await httpClient.post<InvoiceApi, null>(
        invoices.pay(id),
        null,
        toIdempotentConfig(options),
      );
      return mapInvoiceApiToDomain(response);
    },
    async cancel(id, options) {
      const { invoices } = await resolveEndpoint(endpointRegistry, "invoices");
      const response = await httpClient.post<InvoiceApi, null>(
        invoices.cancel(id),
        null,
        toIdempotentConfig(options),
      );
      return mapInvoiceApiToDomain(response);
    },
  };
}
