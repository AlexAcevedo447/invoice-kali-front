import {
  type CreateInvoiceCommand,
  type CreateInvoiceItemCommand,
  type DeleteInvoiceItemCommand,
  type GetInvoiceByIdQuery,
  type GetInvoiceItemByIdQuery,
  type IdempotentRequest,
  type InvoiceItemListResult,
  type InvoiceItemResult,
  type InvoiceListResult,
  type InvoiceMetricsResult,
  type InvoiceResult,
  type InvoiceStatusCommand,
  type ListInvoiceItemsQuery,
  type ListInvoicesQuery,
  type PublicRequest,
  type UpdateInvoiceCommand,
  type UpdateInvoiceItemCommand,
} from "@modules/invoicing/application";

import type { InvoicingRepositories } from "@modules/invoicing/infrastructure/createInvoicingHttpRepositories";
import { toInvoiceId } from "@modules/invoicing/domain/value-objects/InvoiceId";
import { toInvoiceItemId } from "@modules/invoicing/domain/value-objects/InvoiceItemId";
export interface InvoicingService {
  invoices: {
    list(
      query: ListInvoicesQuery,
      options?: PublicRequest,
    ): Promise<InvoiceListResult>;
    getById(
      query: GetInvoiceByIdQuery,
      options?: PublicRequest,
    ): Promise<InvoiceResult>;
    create(
      command: CreateInvoiceCommand,
      options: IdempotentRequest,
    ): Promise<InvoiceResult>;
    update(
      command: UpdateInvoiceCommand,
      options: IdempotentRequest,
    ): Promise<InvoiceResult>;
    pay(
      command: InvoiceStatusCommand,
      options: IdempotentRequest,
    ): Promise<InvoiceResult>;
    cancel(
      command: InvoiceStatusCommand,
      options: IdempotentRequest,
    ): Promise<InvoiceResult>;
  };
  invoiceItems: {
    list(
      query: ListInvoiceItemsQuery,
      options?: PublicRequest,
    ): Promise<InvoiceItemListResult>;
    getById(
      query: GetInvoiceItemByIdQuery,
      options?: PublicRequest,
    ): Promise<InvoiceItemResult>;
    create(
      command: CreateInvoiceItemCommand,
      options: IdempotentRequest,
    ): Promise<InvoiceItemResult>;
    update(
      command: UpdateInvoiceItemCommand,
      options: IdempotentRequest,
    ): Promise<InvoiceItemResult>;
    delete(
      command: DeleteInvoiceItemCommand,
      options: IdempotentRequest,
    ): Promise<void>;
  };
  metrics: {
    get(options?: PublicRequest): Promise<InvoiceMetricsResult>;
  };
}

export const createInvoicingService = (
  repos: InvoicingRepositories,
): InvoicingService => {
  return {
    invoices: {
      list: (query, options) => repos.invoiceRepository.list(query, options),
      getById: (query, options) =>
        repos.invoiceRepository.getById(toInvoiceId(query.id), options),
      create: (command, options) =>
        repos.invoiceRepository.create(command, options),
      update: (command, options) =>
        repos.invoiceRepository.update(
          {
            ...command,
            id: toInvoiceId(command.id),
          },
          options,
        ),
      pay: (command, options) =>
        repos.invoiceRepository.pay(toInvoiceId(command.id), options),
      cancel: (command, options) =>
        repos.invoiceRepository.cancel(toInvoiceId(command.id), options),
    },
    invoiceItems: {
      list: (query, options) =>
        repos.invoiceItemRepository.list(query, options),
      getById: (query, options) =>
        repos.invoiceItemRepository.getById(toInvoiceItemId(query.id), options),
      create: (command, options) =>
        repos.invoiceItemRepository.create(command, options),
      update: (command, options) =>
        repos.invoiceItemRepository.update(
          {
            ...command,
            id: toInvoiceItemId(command.id),
          },
          options,
        ),
      delete: (command, options) =>
        repos.invoiceItemRepository.delete(
          toInvoiceItemId(command.id),
          options,
        ),
    },
    metrics: {
      get: (options) => repos.invoiceMetricsRepository.get(options),
    },
  };
};
