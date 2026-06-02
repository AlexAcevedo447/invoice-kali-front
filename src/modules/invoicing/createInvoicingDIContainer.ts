// Factory para crear el contenedor DI de invoicing usando solo ports y wiring explícito
import type { InvoicingDIContainer } from "./InvoicingDIProvider";
import type { InvoicingRepositoriesPort } from "./ports/InvoicingRepositoriesPort";
import type {
  InvoiceMapperPort,
  HttpConfigPort,
} from "./ports/InfrastructureFactoriesPort";
import type {
  ListInvoicesPort,
  GetInvoiceByIdPort,
  CreateInvoicePort,
  UpdateInvoicePort,
  PayInvoicePort,
  CancelInvoicePort,
} from "./ports/InvoiceUseCasesPort";
import type {
  ListInvoiceItemsPort,
  GetInvoiceItemByIdPort,
  CreateInvoiceItemPort,
  UpdateInvoiceItemPort,
  DeleteInvoiceItemPort,
} from "./ports/InvoiceItemUseCasesPort";
import type { GetInvoicingMetricsPort } from "./ports/InvoiceMetricsPort";
import type { InvoiceQueryPort } from "./ports/InvoiceQueryPort";

// Recibe implementaciones concretas por port y arma el contenedor DI
function createInvoicingDIContainer({
  repositories,
  factories,
  useCases,
}: {
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
}): InvoicingDIContainer {
  return {
    repositories,
    factories,
    useCases,
  };
}

export { createInvoicingDIContainer };
