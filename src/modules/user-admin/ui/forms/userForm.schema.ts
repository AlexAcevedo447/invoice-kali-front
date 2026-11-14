import { z } from "zod";

/**
 * Formularios de usuario (RF-04, CA-04.2 y CA-04.3). Validan antes de enviar;
 * la política de contraseña (12 caracteres, mayúscula, minúscula, número,
 * símbolo, sin espacios) la aplica el servidor y su mensaje se traduce.
 */
export const PASSWORD_POLICY_HINT =
    "Mínimo 12 caracteres, con mayúscula, minúscula, número y símbolo, sin espacios.";

export const EDIT_PASSWORD_HINT = `Opcional: déjala vacía para conservarla. Si la cambias: ${PASSWORD_POLICY_HINT.charAt(0).toLowerCase()}${PASSWORD_POLICY_HINT.slice(1)}`;

const requiredText = (message: string) =>
    z
        .string()
        .transform((value) => value.trim())
        .refine((value) => value.length > 0, message);

const emailSchema = z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, "El correo es obligatorio.")
    .refine((value) => value.length === 0 || z.email().safeParse(value).success, "Ingresa un correo válido.");

const baseFields = {
    identificationNumber: requiredText("La identificación es obligatoria."),
    username: requiredText("El nombre de usuario es obligatorio."),
    email: emailSchema,
};

/** Crear: todo obligatorio; el rol es opcional (solo si quien crea puede asignar roles). */
export const createUserSchema = z.object({
    ...baseFields,
    // La contraseña no se recorta: el servidor rechaza espacios con un mensaje claro.
    password: z.string().refine((value) => value.trim().length > 0, "La contraseña es obligatoria."),
    roleId: z
        .string()
        .optional()
        .transform((value) => {
            const trimmed = (value ?? "").trim();
            return trimmed.length > 0 ? trimmed : undefined;
        }),
});

/** Editar: contraseña opcional (vacía = se conserva); si se escribe, no puede ser solo espacios. */
export const editUserSchema = z.object({
    ...baseFields,
    password: z
        .string()
        .optional()
        .refine(
            (value) => value === undefined || value === "" || value.trim().length > 0,
            "La contraseña no puede ser solo espacios. Déjala vacía para conservarla.",
        )
        .transform((value) => (value ? value : undefined)),
});

export type CreateUserInput = z.input<typeof createUserSchema>;
export type CreateUserOutput = z.output<typeof createUserSchema>;
export type EditUserInput = z.input<typeof editUserSchema>;
export type EditUserOutput = z.output<typeof editUserSchema>;
