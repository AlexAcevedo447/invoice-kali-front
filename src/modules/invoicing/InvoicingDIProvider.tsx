import { useMemo, type PropsWithChildren } from "react";
import { InvoicingDIContext } from "./InvoicingDIContext";
import type { InvoicingRepositoriesPort } from "./ports/InvoicingRepositoriesPort";
import type { InvoiceMapperPort, HttpConfigPort } from "./ports/InfrastructureFactoriesPort";
import type { ListInvoicesPort, GetInvoiceByIdPort, CreateInvoicePort, UpdateInvoicePort, PayInvoicePort, CancelInvoicePort } from "./ports/InvoiceUseCasesPort";
import type { ListInvoiceItemsPort, GetInvoiceItemByIdPort, CreateInvoiceItemPort, UpdateInvoiceItemPort, DeleteInvoiceItemPort } from "./ports/InvoiceItemUseCasesPort";
import type { GetInvoicingMetricsPort } from "./ports/InvoiceMetricsPort";
import type { InvoiceQueryPort } from "./ports/InvoiceQueryPort";

// Contenedor de dependencias para invoicing
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


export const InvoicingDIProvider = ({ children, container }: PropsWithChildren<{ container: InvoicingDIContainer }>) => {
    const value = useMemo(() => container, [container]);
    return <InvoicingDIContext.Provider value={value}>{children}</InvoicingDIContext.Provider>;
};
