import { useMemo, useState } from "react";
import { DataTable, type DataTablePageEvent, type DataTableSortEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";

export interface TableColumn<T> {
    field: string;
    header: string;
    body?: (row: T, field: string) => React.ReactNode;
    sortable?: boolean;
}

export interface TableAction<T> {
    label: string;
    icon: string;
    onClick: (row: T) => void;
    severity?: "success" | "secondary" | "info" | "warning" | "danger" | "help";
    disabled?: (row: T) => boolean;
}

/**
 * Paginación por servidor: la tabla solo recibe la página actual y el total
 * real de registros; al cambiar de página avisa con `onPage`.
 */
export interface ServerPagination {
    totalRecords: number;
    first: number;
    rows: number;
    onPage: (first: number, rows: number) => void;
}

interface GenericTableProps<T> {
    data: T[];
    serverPagination?: ServerPagination;
    columns: TableColumn<T>[];
    actions?: TableAction<T>[];
    loading?: boolean;
    emptyMessage?: string;
    rowKey: keyof T;
}

export const GenericTable = <T extends object>({
    data,
    columns,
    actions,
    loading,
    emptyMessage,
    rowKey,
    serverPagination,
}: GenericTableProps<T>) => {
    // En modo servidor (lazy) PrimeReact no ordena por sí mismo: se ordena la página actual.
    const [sortField, setSortField] = useState<string | undefined>(undefined);
    const [sortOrder, setSortOrder] = useState<1 | -1 | 0 | null | undefined>(undefined);

    const rows = useMemo(() => {
        if (!serverPagination || !sortField || !sortOrder) return data;
        const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });
        return [...data].sort((a, b) => {
            const left = (a as Record<string, unknown>)[sortField];
            const right = (b as Record<string, unknown>)[sortField];
            const result =
                typeof left === "number" && typeof right === "number"
                    ? left - right
                    : collator.compare(String(left ?? ""), String(right ?? ""));
            return result * sortOrder;
        });
    }, [data, serverPagination, sortField, sortOrder]);

    const handleRowAction = (row: T, action: TableAction<T>) => {
        action.onClick(row);
    };

    return (
        <DataTable
            value={rows}
            loading={loading}
            emptyMessage={emptyMessage}
            paginator
            rows={serverPagination?.rows ?? 10}
            stripedRows
            removableSort
            dataKey={String(rowKey)}
            {...(serverPagination
                ? {
                      lazy: true,
                      first: serverPagination.first,
                      totalRecords: serverPagination.totalRecords,
                      onPage: (event: DataTablePageEvent) =>
                          serverPagination.onPage(event.first, event.rows),
                      sortField,
                      sortOrder,
                      onSort: (event: DataTableSortEvent) => {
                          setSortField(event.sortField);
                          setSortOrder(event.sortOrder);
                      },
                  }
                : {})}
        >
            {columns.map((col) => (
                <Column
                    key={col.field}
                    field={col.field}
                    header={col.header}
                    body={col.body ? (row: T) => col.body?.(row, col.field) : undefined}
                    sortable={col.sortable ?? false}
                />
            ))}

            {actions && actions.length > 0 && (
                <Column
                    header="Acciones"
                    body={(row: T) => (
                        <div className="flex gap-2">
                            {actions.map((action, idx) => (
                                <Button
                                    key={idx}
                                    icon={action.icon}
                                    onClick={() => handleRowAction(row, action)}
                                    rounded
                                    outlined
                                    severity={action.severity ?? "secondary"}
                                    disabled={action.disabled?.(row) ?? false}
                                    title={action.label}
                                />
                            ))}
                        </div>
                    )}
                />
            )}
        </DataTable>
    );
};
