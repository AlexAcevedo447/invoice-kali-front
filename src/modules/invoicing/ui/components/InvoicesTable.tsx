import {
    GenericTable,
    type ServerPagination,
    type TableColumn,
    type TableAction,
} from "@shared/ui/table/GenericTable";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import type { InvoiceStatus } from "../constants/invoiceStatus";
import { formatAmount } from "../constants/invoiceFormat";

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
    /** Vista de solo lectura (invoices/read); sin ella no se muestra la acción "Ver". */
    onView?: (invoiceId: string) => void;
    serverPagination?: ServerPagination;
}

export const InvoicesTable = ({
    invoices,
    isLoading = false,
    onEdit,
    onChangeStatus,
    onDelete,
    onView,
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
            // Texto con formato visual; data-value conserva el total exacto del servidor.
            body: (row) => (
                <span data-cy="invoice-row-amount" data-value={row.amount}>
                    {formatAmount(row.amount)}
                </span>
            ),
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

    // Solo las facturas Pendientes admiten acciones; Pagadas y Canceladas quedan
    // cerradas (el backend también lo exige).
    const isClosed = (row: Invoice) => row.status !== "pending";
    const tooltipFor = (label: string) => (row: Invoice) => {
        if (row.status === "paid") return "La factura pagada no admite modificaciones.";
        if (row.status === "cancelled") return "La factura cancelada no admite modificaciones.";
        return label;
    };

    // "Ver" es de solo lectura: disponible también en facturas pagadas o canceladas.
    const viewAction: TableAction<Invoice>[] = onView
        ? [
              {
                  label: "Ver",
                  icon: "pi pi-eye",
                  onClick: (row) => onView(row.id),
                  severity: "secondary",
                  cy: "invoice-view",
              },
          ]
        : [];

    const actions: TableAction<Invoice>[] = [
        ...viewAction,
        {
            label: "Editar",
            icon: "pi pi-pencil",
            onClick: (row) => onEdit(row.id),
            severity: "info",
            disabled: isClosed,
            tooltip: tooltipFor("Editar"),
            cy: "action-edit",
        },
        {
            label: "Cambiar estado",
            icon: "pi pi-refresh",
            onClick: (row) => onChangeStatus(row.id),
            severity: "warning",
            disabled: isClosed,
            tooltip: tooltipFor("Cambiar estado"),
            cy: "action-change-status",
        },
        {
            // Cancela la factura (PATCH /cancel); no la elimina.
            label: "Cancelar",
            icon: "pi pi-ban",
            onClick: (row) => onDelete(row.id),
            severity: "danger",
            disabled: isClosed,
            tooltip: tooltipFor("Cancelar"),
            cy: "action-cancel",
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
