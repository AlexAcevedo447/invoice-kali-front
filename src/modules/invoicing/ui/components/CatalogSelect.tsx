import { useEffect, useMemo, useRef, useState } from "react";
import { Dropdown } from "primereact/dropdown";

export interface CatalogOption<T> {
    id: string;
    label: string;
    entity?: T;
}

interface CatalogSelectProps<T> {
    inputId: string;
    cy: string;
    value: string;
    onChange: (id: string, entity?: T) => void;
    /** Busca en el catálogo del tenant por texto legible (nombre, documento, código). */
    search: (query: string) => Promise<CatalogOption<T>[]>;
    /** Opción ya seleccionada (p. ej. al editar) para mostrar su texto aunque no esté en la búsqueda. */
    initialOption?: CatalogOption<T>;
    placeholder: string;
    disabled?: boolean;
    invalid?: boolean;
}

/**
 * Selector de catálogo con búsqueda en el servidor. El usuario ve y elige texto
 * legible; el identificador técnico (UUID) solo viaja como valor interno.
 */
export const CatalogSelect = <T,>({
    inputId,
    cy,
    value,
    onChange,
    search,
    initialOption,
    placeholder,
    disabled,
    invalid,
}: CatalogSelectProps<T>) => {
    const [options, setOptions] = useState<CatalogOption<T>[]>([]);
    const [loading, setLoading] = useState(!disabled);
    const debounceRef = useRef<number | undefined>(undefined);
    const requestRef = useRef(0);

    // Solo actualiza estado al resolver la búsqueda (seguro de llamar desde efectos).
    const fetchOptions = (query: string) => {
        const requestId = ++requestRef.current;
        search(query)
            .then((result) => {
                if (requestId === requestRef.current) setOptions(result);
            })
            .catch(() => {
                if (requestId === requestRef.current) setOptions([]);
            })
            .finally(() => {
                if (requestId === requestRef.current) setLoading(false);
            });
    };

    useEffect(() => {
        if (!disabled) fetchOptions("");
        return () => window.clearTimeout(debounceRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [disabled]);

    // Mantiene visible la opción seleccionada aunque la búsqueda actual no la incluya.
    const merged = useMemo(() => {
        const selected = initialOption && initialOption.id === value ? initialOption : undefined;
        if (!selected || options.some((o) => o.id === selected.id)) return options;
        return [selected, ...options];
    }, [options, initialOption, value]);

    return (
        <Dropdown
            inputId={inputId}
            data-cy={cy}
            value={value || null}
            options={merged}
            optionLabel="label"
            optionValue="id"
            onChange={(e) => {
                const option = merged.find((o) => o.id === e.value);
                onChange(e.value ?? "", option?.entity);
            }}
            filter
            filterBy="label"
            onFilter={(e) => {
                window.clearTimeout(debounceRef.current);
                setLoading(true);
                debounceRef.current = window.setTimeout(() => fetchOptions(e.filter), 300);
            }}
            placeholder={placeholder}
            emptyMessage={loading ? "Buscando..." : "No hay resultados"}
            emptyFilterMessage={loading ? "Buscando..." : "No hay resultados"}
            disabled={disabled}
            invalid={invalid}
            className="w-full"
        />
    );
};
