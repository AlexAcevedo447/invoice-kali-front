import type { FieldErrors } from "react-hook-form";
import type { CreateInvoiceFormValues } from "./createInvoiceForm.schema";

/** Mensaje de error de un campo anidado de React Hook Form (p. ej. items.0.taxes.1.code). */
export function getErrorMessage(
    errors: FieldErrors<CreateInvoiceFormValues>,
    path: (string | number)[],
): string | undefined {
    let current: unknown = errors;
    for (const key of path) {
        if (typeof current !== "object" || current == null) return undefined;
        current = (current as Record<string, unknown>)[key];
    }
    if (
        typeof current === "object" &&
        current !== null &&
        "message" in current &&
        typeof (current as { message?: unknown }).message === "string"
    ) {
        return (current as { message: string }).message;
    }
    return undefined;
}
