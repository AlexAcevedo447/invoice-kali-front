import type { InvoiceRepository } from "../../domain/repositories/InvoiceRepository";
import type { HttpClient } from "@shared/infrastructure/http/HttpClient";
import type { EndpointRegistryContext } from "@app/api/EndpointRegistry";
import { resolveEndpoint } from "@app/api/EndpointRegistry";
import {
  toIdempotentConfig,
  toPublicConfig,
} from "@modules/invoicing/infrastructure/adapters/httpConfig";
import {
  mapInvoiceApiToDomain,
  type InvoiceApi,
} from "../mappers/invoiceMapper";
type CreateInvoiceApiBody = {
  customer_id: string;
  issue_date?: string;
  due_date?: string;
  items: Array<{
    item_id: string;
    quantity: number;
    unit_price: number;
    taxes: Array<{ code: string; kind?: "DEBIT" | "CREDIT"; rate: number }>;
  }>;
};

type UpdateInvoiceApiBody = {
  customer_id?: string;
  due_date?: string;
};

export type CreateHttpInvoiceRepositoryDeps = {
  httpClient: HttpClient;
  endpointRegistry: EndpointRegistryContext;
};

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
    async listPage(query, options) {
      const { invoices } = await resolveEndpoint(endpointRegistry, "invoices");
      const { data, headers } = await httpClient.getWithMeta<InvoiceApi[]>(
        invoices.listPaginated(query.page ?? 1, query.pageSize ?? 10),
        toPublicConfig(options),
      );
      const items = data.map(mapInvoiceApiToDomain);
      // El servicio de facturación informa el total en la cabecera X-Total-Count.
      const total = Number(headers["x-total-count"]);
      return { items, total: Number.isFinite(total) ? total : items.length };
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
      // Contrato real del servicio de facturación: snake_case (create_invoice_handler.go).
      const response = await httpClient.post<InvoiceApi, CreateInvoiceApiBody>(
        invoices.create,
        {
          customer_id: command.customerId,
          issue_date: command.issueDate,
          due_date: command.dueDate,
          items: command.items.map((item) => ({
            item_id: item.itemId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            taxes: item.taxes.map((tax) => ({
              code: tax.code,
              kind: tax.kind,
              rate: tax.rate,
            })),
          })),
        },
        toIdempotentConfig(options),
      );
      return mapInvoiceApiToDomain(response);
    },
    async update(command, options) {
      const { invoices } = await resolveEndpoint(endpointRegistry, "invoices");
      // Contrato real: solo customer_id y due_date son editables (update_invoice_handler.go).
      const response = await httpClient.put<InvoiceApi, UpdateInvoiceApiBody>(
        invoices.update(command.id),
        {
          customer_id: command.customerId,
          due_date: command.dueDate,
        },
        toIdempotentConfig(options),
      );
      return mapInvoiceApiToDomain(response);
    },
    async pay(id, options) {
      const { invoices } = await resolveEndpoint(endpointRegistry, "invoices");
      const response = await httpClient.patch<InvoiceApi, null>(
        invoices.pay(id),
        null,
        toIdempotentConfig(options),
      );
      return mapInvoiceApiToDomain(response);
    },
    async cancel(id, options) {
      const { invoices } = await resolveEndpoint(endpointRegistry, "invoices");
      const response = await httpClient.patch<InvoiceApi, null>(
        invoices.cancel(id),
        null,
        toIdempotentConfig(options),
      );
      return mapInvoiceApiToDomain(response);
    },
  };
}
