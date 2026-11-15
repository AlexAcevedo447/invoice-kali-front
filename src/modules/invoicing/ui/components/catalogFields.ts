import { parseEsCoDecimal } from "@shared/domain/esCoDecimal";

export interface CatalogFieldConfig {
    name: string;
    label: string;
    /** "decimal": número es-CO con coma decimal (se edita como texto). */
    type: "text" | "decimal";
    requiredMessage?: string;
    min?: number;
}

/**
 * Valida un campo del formulario de catálogo y devuelve el mensaje de error,
 * o null si es válido. Los decimales usan coma (es-CO) y nunca se reinterpretan:
 * primero se informa el formato y después el rango.
 */
export const validateCatalogField = (field: CatalogFieldConfig, value: string | undefined): string | null => {
    const raw = value?.trim() ?? "";
    if (raw === "") return field.requiredMessage ?? null;
    if (field.type !== "decimal") return null;
    const parsed = parseEsCoDecimal(raw);
    if (!parsed.ok) return parsed.error;
    const min = field.min ?? 0;
    return parsed.value < min ? `${field.label} debe ser un número mayor o igual a ${min}` : null;
};

/**
 * Decimal opcional del catálogo (ya validado) → número exacto; vacío = 0.
 * Lanza un error si el texto no es válido (la validación lo impide antes).
 */
export const optionalEsCoDecimalToNumber = (value: string | undefined): number => {
    const raw = value?.trim() ?? "";
    if (raw === "") return 0;
    const parsed = parseEsCoDecimal(raw);
    if (!parsed.ok) throw new Error(parsed.error);
    return parsed.value;
};
