import { GenericTable, type TableColumn, type TableAction } from "@shared/ui/table/GenericTable";
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
}

export const InvoicesTable = ({
    invoices,
    isLoading = false,
    onEdit,
    onChangeStatus,
    onDelete,
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
            label: "Eliminar",
            icon: "pi pi-trash",
            onClick: (row) => onDelete(row.id),
            severity: "danger",
        },
    ];

    return (
        <GenericTable<Invoice>
            data={invoices}
            columns={columns}
            actions={actions}
            loading={isLoading}
            emptyMessage="No hay facturas registradas"
            rowKey="id"
        />
    );
};
