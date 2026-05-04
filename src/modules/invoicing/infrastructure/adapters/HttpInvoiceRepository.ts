import { InvoiceEndpoints } from "@modules/invoicing/application/endpoints";
import type { Invoice } from "@modules/invoicing/domain/entities";
import type {
  IdempotentRequestOptions,
  InvoiceRepository,
  RequestOptions,
} from "@modules/invoicing/domain/repositories";
import type { InvoiceId } from "@modules/invoicing/domain/value-objects";
import {
  mapInvoiceApiToDomain,
  type InvoiceApi,
} from "@modules/invoicing/infrastructure/mappers/invoiceMapper";
import type { HttpClient } from "@shared/infrastructure/http";
import { httpCore } from "@shared/infrastructure/http";
import { toIdempotentConfig, toPublicConfig } from "./httpConfig";

export class HttpInvoiceRepository implements InvoiceRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient = httpCore) {
    this.httpClient = httpClient;
  }

  async list(
    query: { page?: number; pageSize?: number },
    options?: RequestOptions,
  ): Promise<Invoice[]> {
    const response = await this.httpClient.get<InvoiceApi[]>(
      InvoiceEndpoints.listPaginated(query.page ?? 1, query.pageSize ?? 20),
      toPublicConfig(options),
    );

    return response.map(mapInvoiceApiToDomain);
  }

  findAll(options?: RequestOptions): Promise<Invoice[]> {
    return this.list({ page: 1, pageSize: 20 }, options);
  }

  async getById(id: InvoiceId, options?: RequestOptions): Promise<Invoice> {
    const response = await this.httpClient.get<InvoiceApi>(
      InvoiceEndpoints.getById(id),
      toPublicConfig(options),
    );

    return mapInvoiceApiToDomain(response);
  }

  async findById(
    id: InvoiceId,
    options?: RequestOptions,
  ): Promise<Invoice | null> {
    try {
      return await this.getById(id, options);
    } catch {
      return null;
    }
  }

  async create(
    command: {
      customerId: string;
      issueDate?: string;
      dueDate?: string;
      items: Array<{
        itemId: string;
        quantity: number;
        unitPrice: number;
        taxes: Array<{ code: string; kind?: "DEBIT" | "CREDIT"; rate: number }>;
      }>;
    },
    options: IdempotentRequestOptions,
  ): Promise<Invoice> {
    const response = await this.httpClient.post<
      InvoiceApi,
      {
        customer_id: string;
        issue_date?: string;
        due_date?: string;
        items: Array<{
          item_id: string;
          quantity: number;
          unit_price: number;
          taxes: Array<{
            code: string;
            kind?: "DEBIT" | "CREDIT";
            rate: number;
          }>;
        }>;
      }
    >(
      InvoiceEndpoints.create,
      {
        customer_id: command.customerId,
        issue_date: command.issueDate,
        due_date: command.dueDate,
        items: command.items.map((item) => ({
          item_id: item.itemId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          taxes: item.taxes,
        })),
      },
      toIdempotentConfig(options),
    );

    return mapInvoiceApiToDomain(response);
  }

  async update(
    command: {
      id: InvoiceId;
      customerId?: string;
      dueDate?: string;
    },
    options: IdempotentRequestOptions,
  ): Promise<Invoice> {
    const response = await this.httpClient.put<
      InvoiceApi,
      {
        customer_id?: string;
        due_date?: string;
      }
    >(
      InvoiceEndpoints.update(command.id),
      {
        customer_id: command.customerId,
        due_date: command.dueDate,
      },
      toIdempotentConfig(options),
    );

    return mapInvoiceApiToDomain(response);
  }

  async pay(
    id: InvoiceId,
    options: IdempotentRequestOptions,
  ): Promise<Invoice> {
    const response = await this.httpClient.patch<InvoiceApi, null>(
      InvoiceEndpoints.pay(id),
      null,
      toIdempotentConfig(options),
    );

    return mapInvoiceApiToDomain(response);
  }

  async cancel(
    id: InvoiceId,
    options: IdempotentRequestOptions,
  ): Promise<Invoice> {
    const response = await this.httpClient.patch<InvoiceApi, null>(
      InvoiceEndpoints.cancel(id),
      null,
      toIdempotentConfig(options),
    );

    return mapInvoiceApiToDomain(response);
  }
}
