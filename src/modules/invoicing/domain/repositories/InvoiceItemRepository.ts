import type { InvoiceItem } from "../entities/InvoiceItem";
import type {
  IdempotentRequestOptions,
  RequestOptions,
} from "./RequestOptions";
export type { IdempotentRequestOptions, RequestOptions };
import type { InvoiceItemId } from "../value-objects/InvoiceItemId";

export interface InvoiceItemRepository {
  list(
    query: { page?: number; pageSize?: number },
    options?: RequestOptions,
  ): Promise<InvoiceItem[]>;

  getById(id: InvoiceItemId, options?: RequestOptions): Promise<InvoiceItem>;

  create(
    command: {
      invoiceId: string;
      itemId: string;
      quantity: number;
      unitPrice: number;
      taxes: Array<{ code: string; kind?: "DEBIT" | "CREDIT"; rate: number }>;
    },
    options: IdempotentRequestOptions,
  ): Promise<InvoiceItem>;

  update(
    command: {
      id: InvoiceItemId;
      quantity: number;
      unitPrice: number;
      taxes: Array<{ code: string; kind?: "DEBIT" | "CREDIT"; rate: number }>;
    },
    options: IdempotentRequestOptions,
  ): Promise<InvoiceItem>;

  delete(id: InvoiceItemId, options: IdempotentRequestOptions): Promise<void>;
}
