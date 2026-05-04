import { DataTable } from "primereact/datatable";
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

interface GenericTableProps<T> {
    data: T[];
    columns: TableColumn<T>[];
    actions?: TableAction<T>[];
    loading?: boolean;
    emptyMessage?: string;
    rowKey: keyof T;
}

export const GenericTable = <T extends Record<string, any> = Record<string, any>,>(
    {
        data,
        columns,
        actions,
        loading = false,
        emptyMessage = "No hay datos",
    }: GenericTableProps<T>,
) => {
    const handleRowAction = (row: T, action: TableAction<T>) => {
        action.onClick(row);
    };

    return (
        <DataTable
            value={data as any}
            loading={loading}
            emptyMessage={emptyMessage}
            paginator
            rows={10}
            stripedRows
            removableSort
        >
            {columns.map((col) => (
                <Column
                    key={col.field}
                    field={col.field}
                    header={col.header}
                    body={col.body ? (row: any) => col.body?.(row, col.field) : undefined}
                    sortable={col.sortable ?? false}
                />
            ))}

            {actions && actions.length > 0 && (
                <Column
                    header="Acciones"
                    body={(row: any) => (
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
                    exportable={false}
                />
            )}
        </DataTable>
    );
};
