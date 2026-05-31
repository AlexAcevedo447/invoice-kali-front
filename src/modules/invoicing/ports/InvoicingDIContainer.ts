// Definición del tipo InvoicingDIContainer para evitar ciclos
import type { InvoicingRepositoriesPort } from "@modules/invoicing/ports/InvoicingRepositoriesPort";
import type {
  InvoiceMapperPort,
  HttpConfigPort,
} from "@modules/invoicing/ports/InfrastructureFactoriesPort";
import type {
  ListInvoicesPort,
  GetInvoiceByIdPort,
  CreateInvoicePort,
  UpdateInvoicePort,
  PayInvoicePort,
  CancelInvoicePort,
} from "@modules/invoicing/ports/InvoiceUseCasesPort";
import type {
  ListInvoiceItemsPort,
  GetInvoiceItemByIdPort,
  CreateInvoiceItemPort,
  UpdateInvoiceItemPort,
  DeleteInvoiceItemPort,
} from "./InvoiceItemUseCasesPort";
import type { GetInvoicingMetricsPort } from "@modules/invoicing/ports/InvoiceMetricsPort";
import type { InvoiceQueryPort } from "@modules/invoicing/ports/InvoiceQueryPort";

export interface InvoicingDIContainer {
  repositories: InvoicingRepositoriesPort;
  factories: {
    mappers: InvoiceMapperPort;
    httpConfig: HttpConfigPort;
  };
  useCases: {
    invoices: {
      listQuery: ListInvoicesPort;
      getByIdQuery: GetInvoiceByIdPort;
      createCommand: CreateInvoicePort;
      updateCommand: UpdateInvoicePort;
      payCommand: PayInvoicePort;
      cancelCommand: CancelInvoicePort;
    };
    invoiceItems: {
      listQuery: ListInvoiceItemsPort;
      getByIdQuery: GetInvoiceItemByIdPort;
      createCommand: CreateInvoiceItemPort;
      updateCommand: UpdateInvoiceItemPort;
      deleteCommand: DeleteInvoiceItemPort;
    };
    metrics: GetInvoicingMetricsPort;
    queries: InvoiceQueryPort;
  };
}
