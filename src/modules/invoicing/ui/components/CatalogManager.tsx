import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { GenericTable, type TableColumn } from "@shared/ui/table/GenericTable";
import { FormField } from "@shared/ui/forms/FormField";
import { useGlobalToast } from "@shared/ui/GlobalToastContext";
import type { CatalogPage } from "@modules/invoicing/domain/entities/Catalog";

export interface CatalogFieldConfig {
    name: string;
    label: string;
    type: "text" | "number";
    requiredMessage?: string;
    min?: number;
}

interface CatalogManagerProps<T extends { id: string }> {
    title: string;
    cy: string;
    createTitle: string;
    createLabel: string;
    successSummary: string;
    searchPlaceholder: string;
    emptyMessage: string;
    fields: CatalogFieldConfig[];
    columns: TableColumn<T>[];
    list: (search: string, page: number, pageSize: number) => Promise<CatalogPage<T>>;
    create: (values: Record<string, string>) => Promise<T>;
}

const PAGE_SIZE = 10;

const errorMessage = (error: unknown) =>
    error instanceof Error && error.message ? error.message : "Error inesperado.";

/**
 * Pantalla mínima de un catálogo del tenant: alta de registros, búsqueda por
 * texto legible y listado paginado en el servidor. No muestra identificadores
 * técnicos: el servidor genera los UUID y los asocia al tenant del token.
 */
export const CatalogManager = <T extends { id: string }>({
    title,
    cy,
    createTitle,
    createLabel,
    successSummary,
    searchPlaceholder,
    emptyMessage,
    fields,
    columns,
    list,
    create,
}: CatalogManagerProps<T>) => {
    const { show } = useGlobalToast();
    const emptyValues = Object.fromEntries(fields.map((f) => [f.name, ""]));
    const [values, setValues] = useState<Record<string, string>>(emptyValues);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [data, setData] = useState<CatalogPage<T>>({ items: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const debounceRef = useRef<number | undefined>(undefined);

    // Solo actualiza estado al resolver la consulta (seguro de llamar desde efectos).
    const load = useCallback(
        (query: string, targetPage: number) => {
            list(query, targetPage, PAGE_SIZE)
                .then((result) => {
                    setData(result);
                    setPage(targetPage);
                })
                .catch((error: unknown) =>
                    show({ severity: "error", summary: "Error", detail: errorMessage(error), life: 4000 }),
                )
                .finally(() => setLoading(false));
        },
        [list, show],
    );

    useEffect(() => {
        load("", 1);
        return () => window.clearTimeout(debounceRef.current);
    }, [load]);

    const onSearch = (value: string) => {
        setSearch(value);
        window.clearTimeout(debounceRef.current);
        setLoading(true);
        debounceRef.current = window.setTimeout(() => load(value, 1), 300);
    };

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextErrors: Record<string, string> = {};
        for (const field of fields) {
            const raw = values[field.name]?.trim() ?? "";
            if (field.requiredMessage && raw === "") nextErrors[field.name] = field.requiredMessage;
            if (field.type === "number" && raw !== "" && (Number.isNaN(Number(raw)) || Number(raw) < (field.min ?? 0))) {
                nextErrors[field.name] = `${field.label} debe ser un número mayor o igual a ${field.min ?? 0}`;
            }
        }
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSaving(true);
        try {
            await create(values);
            show({ severity: "success", summary: successSummary, detail: "Registro guardado correctamente.", life: 3000 });
            setValues(emptyValues);
            setLoading(true);
            load(search, 1);
        } catch (error) {
            show({ severity: "error", summary: "No se pudo guardar", detail: errorMessage(error), life: 5000 });
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="p-5" data-cy={`${cy}-page`}>
            <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 700 }} className="mb-4">
                {title}
            </h1>

            <section className="surface-card p-4 border-round border-1 border-300 mb-4">
                <h3 className="mt-0 mb-3">{createTitle}</h3>
                <form onSubmit={onSubmit} noValidate className="grid">
                    {fields.map((field) => (
                        <div key={field.name} className="col-12 md:col-4">
                            <FormField
                                id={`${cy}-${field.name}`}
                                label={field.label}
                                required={Boolean(field.requiredMessage)}
                                error={errors[field.name]}
                            >
                                <input
                                    id={`${cy}-${field.name}`}
                                    data-cy={`${cy}-${field.name}`}
                                    type={field.type}
                                    min={field.min}
                                    step={field.type === "number" ? "0.01" : undefined}
                                    className="p-inputtext p-component w-full"
                                    value={values[field.name] ?? ""}
                                    onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                                />
                            </FormField>
                        </div>
                    ))}
                    <div className="col-12">
                        <button type="submit" className="p-button p-component" disabled={saving} data-cy={`${cy}-submit`}>
                            {saving ? "Guardando..." : createLabel}
                        </button>
                    </div>
                </form>
            </section>

            <div className="mb-3">
                <input
                    type="search"
                    data-cy={`${cy}-search`}
                    className="p-inputtext p-component w-full md:w-6"
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>

            <div data-cy={`${cy}-table`} className="surface-card border-round border-1 border-surface-200">
                <GenericTable<T>
                    data={data.items}
                    columns={columns}
                    loading={loading}
                    emptyMessage={emptyMessage}
                    rowKey="id"
                    serverPagination={{
                        totalRecords: data.total,
                        first: (page - 1) * PAGE_SIZE,
                        rows: PAGE_SIZE,
                        onPage: (first) => {
                            setLoading(true);
                            load(search, Math.floor(first / PAGE_SIZE) + 1);
                        },
                    }}
                />
            </div>
        </section>
    );
};
