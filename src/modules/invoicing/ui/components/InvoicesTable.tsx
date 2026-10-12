import {
    GenericTable,
    type ServerPagination,
    type TableColumn,
    type TableAction,
} from "@shared/ui/table/GenericTable";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import type { InvoiceStatus } from "../constants/invoiceStatus";

interface Invoice {
    id: string;
    number: string;
    clientName: string;
    amount: number;
    status: InvoiceStatus;
    dueDate: string;
}

interface InvoicesTableProps {
    invoices: Invoice[];
    isLoading?: boolean;
    onEdit: (invoiceId: string) => void;
    onChangeStatus: (invoiceId: string) => void;
    onDelete: (invoiceId: string) => void;
    serverPagination?: ServerPagination;
}

export const InvoicesTable = ({
    invoices,
    isLoading = false,
    onEdit,
    onChangeStatus,
    onDelete,
    serverPagination,
}: InvoicesTableProps) => {
    const columns: TableColumn<Invoice>[] = [
        {
            field: "number",
            header: "N° Factura",
            sortable: true,
        },
        {
            field: "clientName",
            header: "Cliente",
            sortable: true,
            body: (row) => <span data-cy="invoice-row-customer">{row.clientName}</span>,
        },
        {
            field: "amount",
            header: "Monto",
            sortable: true,
            body: (row) => `$${row.amount.toFixed(2)}`,
        },
        {
            field: "status",
            header: "Estado",
            body: (row) => <InvoiceStatusBadge status={row.status} />,
        },
        {
            field: "dueDate",
            header: "Vencimiento",
            body: (row) => new Date(row.dueDate).toLocaleDateString("es-ES"),
        },
    ];

    const actions: TableAction<Invoice>[] = [
        {
            label: "Editar",
            icon: "pi pi-pencil",
            onClick: (row) => onEdit(row.id),
            severity: "info",
        },
        {
            label: "Cambiar estado",
            icon: "pi pi-refresh",
            onClick: (row) => onChangeStatus(row.id),
            severity: "warning",
        },
        {
            // Cancela la factura (PATCH /cancel); no la elimina.
            label: "Cancelar",
            icon: "pi pi-ban",
            onClick: (row) => onDelete(row.id),
            severity: "danger",
        },
    ];

    return (
        <div data-cy="invoice-table">
            <GenericTable<Invoice>
                data={invoices}
                columns={columns}
                actions={actions}
                loading={isLoading}
                emptyMessage="No hay facturas registradas"
                rowKey="id"
                serverPagination={serverPagination}
            />
        </div>
    );
};
