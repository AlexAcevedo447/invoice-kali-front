import {
  CancelInvoiceUseCase,
  CreateInvoiceItemUseCase,
  CreateInvoiceUseCase,
  DeleteInvoiceItemUseCase,
  GetInvoiceByIdUseCase,
  GetInvoiceItemByIdUseCase,
  GetInvoicingMetricsUseCase,
  ListInvoiceItemsUseCase,
  ListInvoicesUseCase,
  PayInvoiceUseCase,
  UpdateInvoiceItemUseCase,
  UpdateInvoiceUseCase,
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
import type { InvoicingRepositories } from "@modules/invoicing/infrastructure";

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
  repositories: InvoicingRepositories,
): InvoicingService => {
  const listInvoices = new ListInvoicesUseCase(repositories.invoiceRepository);
  const getInvoiceById = new GetInvoiceByIdUseCase(
    repositories.invoiceRepository,
  );
  const createInvoice = new CreateInvoiceUseCase(
    repositories.invoiceRepository,
  );
  const updateInvoice = new UpdateInvoiceUseCase(
    repositories.invoiceRepository,
  );
  const payInvoice = new PayInvoiceUseCase(repositories.invoiceRepository);
  const cancelInvoice = new CancelInvoiceUseCase(
    repositories.invoiceRepository,
  );

  const listInvoiceItems = new ListInvoiceItemsUseCase(
    repositories.invoiceItemRepository,
  );
  const getInvoiceItemById = new GetInvoiceItemByIdUseCase(
    repositories.invoiceItemRepository,
  );
  const createInvoiceItem = new CreateInvoiceItemUseCase(
    repositories.invoiceItemRepository,
  );
  const updateInvoiceItem = new UpdateInvoiceItemUseCase(
    repositories.invoiceItemRepository,
  );
  const deleteInvoiceItem = new DeleteInvoiceItemUseCase(
    repositories.invoiceItemRepository,
  );

  const getInvoicingMetrics = new GetInvoicingMetricsUseCase(
    repositories.invoiceMetricsRepository,
  );

  return {
    invoices: {
      list: (query, options) => listInvoices.execute(query, options),
      getById: (query, options) => getInvoiceById.execute(query, options),
      create: (command, options) => createInvoice.execute(command, options),
      update: (command, options) => updateInvoice.execute(command, options),
      pay: (command, options) => payInvoice.execute(command, options),
      cancel: (command, options) => cancelInvoice.execute(command, options),
    },
    invoiceItems: {
      list: (query, options) => listInvoiceItems.execute(query, options),
      getById: (query, options) => getInvoiceItemById.execute(query, options),
      create: (command, options) => createInvoiceItem.execute(command, options),
      update: (command, options) => updateInvoiceItem.execute(command, options),
      delete: (command, options) => deleteInvoiceItem.execute(command, options),
    },
    metrics: {
      get: (options) => getInvoicingMetrics.execute(options),
    },
  };
};
