import type {
  CreateInvoiceCommand,
  IdempotentRequest,
  InvoiceListResult,
  InvoiceResult,
  InvoiceStatusCommand,
  ListInvoicesQuery,
  PublicRequest,
  UpdateInvoiceCommand,
} from "@modules/invoicing/application/contracts";

export interface ListInvoicesPort {
  list(
    query: ListInvoicesQuery,
    options?: PublicRequest,
  ): Promise<InvoiceListResult>;
}

export interface GetInvoiceByIdPort {
  getById(id: string, options?: PublicRequest): Promise<InvoiceResult>;
}

export interface CreateInvoicePort {
  create(
    command: CreateInvoiceCommand,
    options: IdempotentRequest,
  ): Promise<InvoiceResult>;
}

export interface UpdateInvoicePort {
  update(
    command: UpdateInvoiceCommand,
    options: IdempotentRequest,
  ): Promise<InvoiceResult>;
}

export interface PayInvoicePort {
  pay(
    command: InvoiceStatusCommand,
    options: IdempotentRequest,
  ): Promise<InvoiceResult>;
}

export interface CancelInvoicePort {
  cancel(
    command: InvoiceStatusCommand,
    options: IdempotentRequest,
  ): Promise<InvoiceResult>;
}
