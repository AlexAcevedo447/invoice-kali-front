import { z } from "zod";
import { KNOWN_MESSAGES } from "@shared/application/http/backendMessages";

/**
 * Formularios de usuario (RF-04, CA-04.2 y CA-04.3). Validan antes de enviar,
 * incluida la política de contraseña, que replica la de kali-auth-context
 * (internal/domain/policies/password_policy.go) con sus mismos mensajes
 * traducidos; el servidor la vuelve a aplicar.
 */
export const PASSWORD_POLICY_HINT =
    "Mínimo 12 caracteres, con mayúscula, minúscula, número y símbolo, sin espacios.";

export const EDIT_PASSWORD_HINT = `Opcional: déjala vacía para conservarla. Si la cambias: ${PASSWORD_POLICY_HINT.charAt(0).toLowerCase()}${PASSWORD_POLICY_HINT.slice(1)}`;

/** Mensajes de la política: los mismos que traduce backendMessages.ts para el servidor. */
export const PASSWORD_POLICY_MESSAGES = {
    tooShort: KNOWN_MESSAGES["password must have at least 12 characters"],
    whitespace: KNOWN_MESSAGES["password must not contain whitespace"],
    missingUpper: KNOWN_MESSAGES["password must include at least one uppercase letter"],
    missingLower: KNOWN_MESSAGES["password must include at least one lowercase letter"],
    missingDigit: KNOWN_MESSAGES["password must include at least one digit"],
    missingSymbol: KNOWN_MESSAGES["password must include at least one symbol"],
} as const;

export const MIN_PASSWORD_LENGTH = 12;

/**
 * Primer incumplimiento de la política de contraseña, en el mismo orden que el
 * servidor, o null si la cumple. La longitud se cuenta en caracteres Unicode
 * (code points), no en bytes ni en unidades UTF-16: "Ñandú#Clav1" tiene 11.
 * La contraseña no se recorta.
 */
export const passwordPolicyError = (password: string): string | null => {
    if ([...password].length < MIN_PASSWORD_LENGTH) return PASSWORD_POLICY_MESSAGES.tooShort;
    if (/\p{White_Space}/u.test(password)) return PASSWORD_POLICY_MESSAGES.whitespace;
    if (!/\p{Lu}/u.test(password)) return PASSWORD_POLICY_MESSAGES.missingUpper;
    if (!/\p{Ll}/u.test(password)) return PASSWORD_POLICY_MESSAGES.missingLower;
    if (!/\p{Nd}/u.test(password)) return PASSWORD_POLICY_MESSAGES.missingDigit;
    if (!/[\p{P}\p{S}]/u.test(password)) return PASSWORD_POLICY_MESSAGES.missingSymbol;
    return null;
};

const addPasswordPolicyIssue = (password: string, ctx: z.RefinementCtx) => {
    const message = passwordPolicyError(password);
    if (message) ctx.addIssue({ code: "custom", message });
};

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
    // La contraseña no se recorta: los espacios se rechazan con un mensaje claro.
    password: z.string().superRefine((value, ctx) => {
        if (value.trim().length === 0) {
            ctx.addIssue({ code: "custom", message: KNOWN_MESSAGES["password is required"] });
            return;
        }
        addPasswordPolicyIssue(value, ctx);
    }),
    roleId: z
        .string()
        .optional()
        .transform((value) => {
            const trimmed = (value ?? "").trim();
            return trimmed.length > 0 ? trimmed : undefined;
        }),
});

/**
 * Editar: contraseña opcional (vacía = se conserva); si se escribe, no puede ser
 * solo espacios y debe cumplir la política.
 */
export const editUserSchema = z.object({
    ...baseFields,
    password: z
        .string()
        .optional()
        .superRefine((value, ctx) => {
            if (value === undefined || value === "") return;
            if (value.trim().length === 0) {
                ctx.addIssue({
                    code: "custom",
                    message: "La contraseña no puede ser solo espacios. Déjala vacía para conservarla.",
                });
                return;
            }
            addPasswordPolicyIssue(value, ctx);
        })
        .transform((value) => (value ? value : undefined)),
});

export type CreateUserInput = z.input<typeof createUserSchema>;
export type CreateUserOutput = z.output<typeof createUserSchema>;
export type EditUserInput = z.input<typeof editUserSchema>;
export type EditUserOutput = z.output<typeof editUserSchema>;
