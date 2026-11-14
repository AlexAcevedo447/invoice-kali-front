import { z } from "zod";

/**
 * Mismo formato que valida kali-auth-context (identity.ValidateTenantCode):
 * 3 a 40 caracteres, minúsculas, dígitos o guiones, sin guion al inicio ni al final.
 */
export const TENANT_CODE_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

export const TENANT_CODE_HINT =
    "3 a 40 caracteres: minúsculas, números o guiones (sin guion al inicio ni al final).";

/** Normaliza lo que escribe el usuario: sin espacios a los lados y en minúsculas. */
export const normalizeTenantCode = (raw: string): string => raw.trim().toLowerCase();

const nameSchema = z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, "El nombre de la empresa es obligatorio.");

const codeSchema = z
    .string()
    .transform(normalizeTenantCode)
    .refine((value) => TENANT_CODE_PATTERN.test(value), `Código inválido: ${TENANT_CODE_HINT}`);

/** Crear: el código es opcional (si se omite, el servidor lo deriva del nombre). */
export const createTenantSchema = z.object({
    name: nameSchema,
    code: z.union([z.literal("").transform(() => undefined), codeSchema]).optional(),
});

/** Editar: la empresa ya tiene código, así que es obligatorio y se valida igual. */
export const editTenantSchema = z.object({
    name: nameSchema,
    code: codeSchema,
});

export type CreateTenantInput = z.output<typeof createTenantSchema>;
export type EditTenantInput = z.output<typeof editTenantSchema>;

/** Valida y devuelve el primer mensaje por campo (para mostrar bajo cada input). */
export const fieldErrors = (error: z.ZodError): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const issue of error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!(key in out)) out[key] = issue.message;
    }
    return out;
};
