import { InvoiceEndpoints } from "@modules/invoicing/application/endpoints";
import type { InvoiceItem } from "@modules/invoicing/domain/entities";
import type {
  IdempotentRequestOptions,
  InvoiceItemRepository,
  RequestOptions,
} from "@modules/invoicing/domain/repositories";
import type { InvoiceItemId } from "@modules/invoicing/domain/value-objects";
import {
  mapInvoiceItemApiToDomain,
  type InvoiceItemApi,
} from "@modules/invoicing/infrastructure/mappers/invoiceMapper";
import type { HttpClient } from "@shared/infrastructure/http";
import { httpCore } from "@shared/infrastructure/http";
import { toIdempotentConfig, toPublicConfig } from "./httpConfig";

export class HttpInvoiceItemRepository implements InvoiceItemRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient = httpCore) {
    this.httpClient = httpClient;
  }

  async list(
    query: { page?: number; pageSize?: number },
    options?: RequestOptions,
  ): Promise<InvoiceItem[]> {
    const response = await this.httpClient.get<InvoiceItemApi[]>(
      InvoiceEndpoints.invoiceItemsList(query.page ?? 1, query.pageSize ?? 20),
      toPublicConfig(options),
    );

    return response.map(mapInvoiceItemApiToDomain);
  }

  async getById(
    id: InvoiceItemId,
    options?: RequestOptions,
  ): Promise<InvoiceItem> {
    const response = await this.httpClient.get<InvoiceItemApi>(
      InvoiceEndpoints.invoiceItemsGetById(id),
      toPublicConfig(options),
    );

    return mapInvoiceItemApiToDomain(response);
  }

  async create(
    command: {
      invoiceId: string;
      itemId: string;
      quantity: number;
      unitPrice: number;
      taxes: Array<{ code: string; kind?: "DEBIT" | "CREDIT"; rate: number }>;
    },
    options: IdempotentRequestOptions,
  ): Promise<InvoiceItem> {
    const response = await this.httpClient.post<
      InvoiceItemApi,
      {
        invoice_id: string;
        item_id: string;
        quantity: number;
        unit_price: number;
        taxes: Array<{ code: string; kind?: "DEBIT" | "CREDIT"; rate: number }>;
      }
    >(
      InvoiceEndpoints.invoiceItemsCreate,
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
  }

  async update(
    command: {
      id: InvoiceItemId;
      quantity: number;
      unitPrice: number;
      taxes: Array<{ code: string; kind?: "DEBIT" | "CREDIT"; rate: number }>;
    },
    options: IdempotentRequestOptions,
  ): Promise<InvoiceItem> {
    const response = await this.httpClient.put<
      InvoiceItemApi,
      {
        quantity: number;
        unit_price: number;
        taxes: Array<{ code: string; kind?: "DEBIT" | "CREDIT"; rate: number }>;
      }
    >(
      InvoiceEndpoints.invoiceItemsUpdate(command.id),
      {
        quantity: command.quantity,
        unit_price: command.unitPrice,
        taxes: command.taxes,
      },
      toIdempotentConfig(options),
    );

    return mapInvoiceItemApiToDomain(response);
  }

  async delete(
    id: InvoiceItemId,
    options: IdempotentRequestOptions,
  ): Promise<void> {
    await this.httpClient.delete<void>(
      InvoiceEndpoints.invoiceItemsDelete(id),
      toIdempotentConfig(options),
    );
  }
}
