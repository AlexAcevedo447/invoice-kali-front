import { z } from "zod";

/**
 * Crear y editar rol (RF-06): nombre obligatorio sin contar espacios a los
 * lados (el servidor responde 400 "role name is required"); descripción opcional.
 */
export const roleSchema = z.object({
    name: z
        .string()
        .transform((value) => value.trim())
        .refine((value) => value.length > 0, "El nombre del rol es obligatorio."),
    description: z
        .string()
        .optional()
        .transform((value) => (value ?? "").trim()),
});

export type RoleFormInput = z.input<typeof roleSchema>;
export type RoleFormOutput = z.output<typeof roleSchema>;

/** Clave de comparación de nombres de rol (el servidor no distingue mayúsculas ni espacios exteriores). */
export const roleNameKey = (name: string): string => name.trim().toLowerCase();
