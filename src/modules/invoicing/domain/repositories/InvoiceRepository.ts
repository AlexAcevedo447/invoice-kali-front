import type { Invoice } from "../entities/Invoice";
import type {
  IdempotentRequestOptions,
  RequestOptions,
} from "./RequestOptions";
export type { IdempotentRequestOptions, RequestOptions };
import type { InvoiceId } from "../value-objects/InvoiceId";

export interface InvoiceRepository {
  list(
    query: { page?: number; pageSize?: number },
    options?: RequestOptions,
  ): Promise<Invoice[]>;

  findAll(options?: RequestOptions): Promise<Invoice[]>;

  getById(id: InvoiceId, options?: RequestOptions): Promise<Invoice>;

  findById(id: InvoiceId, options?: RequestOptions): Promise<Invoice | null>;

  create(
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
  ): Promise<Invoice>;

  update(
    command: {
      id: InvoiceId;
      customerId?: string;
      dueDate?: string;
    },
    options: IdempotentRequestOptions,
  ): Promise<Invoice>;

  pay(id: InvoiceId, options: IdempotentRequestOptions): Promise<Invoice>;

  cancel(id: InvoiceId, options: IdempotentRequestOptions): Promise<Invoice>;
}
