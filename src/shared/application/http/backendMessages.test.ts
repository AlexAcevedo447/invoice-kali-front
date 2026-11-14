import { describe, expect, it } from "vitest";
import { KNOWN_MESSAGES, translateBackendMessage } from "./backendMessages";

describe("translateBackendMessage", () => {
    it.each([
        ["tenant code already exists", "Ya existe una empresa con ese código."],
        ["tenant name is required", "El nombre de la empresa es obligatorio."],
        [
            "tenant code must have 3-40 lowercase letters, digits or hyphens",
            "El código de empresa debe tener de 3 a 40 minúsculas, números o guiones.",
        ],
        ["tenant status must be ACTIVE or SUSPENDED", "El estado de la empresa debe ser activa o suspendida."],
        ["platform administrator required", "Esta acción solo la puede realizar el administrador de la plataforma."],
        ["tenant is suspended", "La empresa está suspendida. Contacta al administrador."],
        ["platform tenant cannot be suspended", "La empresa de la plataforma no se puede suspender."],
    ])("traduce %s", (message, expected) => {
        expect(translateBackendMessage(message)).toBe(expected);
    });

    it.each([
        "insufficient permissions",
        "cannot grant privileges you do not have",
        "role name is required",
        "role name already exists",
        "role is assigned to users",
        "protected administrative role",
        "permission resource is required",
        "permission action is required",
        "permission already exists",
        "permission is assigned to roles",
        "protected administrative permission",
        "operation would leave the tenant without an administrator",
        "unknown permission resource",
        "unknown permission action",
    ])("traduce el mensaje RBAC %s", (message) => {
        const translated = translateBackendMessage(message);
        expect(translated).not.toBe(message);
        expect(translated.length).toBeGreaterThan(0);
    });

    it.each([
        ["insufficient permissions", "No tienes permiso para realizar esta acción."],
        [
            "cannot manage a user with privileges you do not have",
            "No puedes editar ni eliminar a un usuario con permisos que tú no tienes.",
        ],
        ["a user with this email already exists for this tenant", "Ya existe un usuario registrado con este correo electrónico."],
        ["email is required", "El correo es obligatorio."],
        ["password is required", "La contraseña es obligatoria."],
        ["password must have at least 12 characters", "La contraseña debe tener al menos 12 caracteres."],
        ["password must include at least one uppercase letter", "La contraseña debe incluir al menos una letra mayúscula."],
        ["password must include at least one lowercase letter", "La contraseña debe incluir al menos una letra minúscula."],
        ["password must include at least one digit", "La contraseña debe incluir al menos un número."],
        ["password must include at least one symbol", "La contraseña debe incluir al menos un símbolo."],
        ["password must not contain whitespace", "La contraseña no debe contener espacios."],
    ])("traduce el mensaje de usuarios %s", (message, expected) => {
        expect(translateBackendMessage(message)).toBe(expected);
    });

    it("explica que un usuario con roles debe quedarse sin roles antes de eliminarlo", () => {
        const translated = translateBackendMessage("user has roles assigned");
        expect(translated).toContain("tiene roles asignados");
        expect(translated).toContain("Roles");
    });

    it("explica que no se puede dejar a la empresa sin administrador", () => {
        expect(translateBackendMessage("operation would leave the tenant without an administrator")).toContain(
            "sin ningún administrador",
        );
    });

    it("explica que un rol asignado debe quitarse antes de eliminarlo", () => {
        expect(translateBackendMessage("role is assigned to users")).toBe(
            "El rol está asignado a usuarios. Quítalo de esos usuarios antes de eliminarlo.",
        );
    });

    it.each([
        ["tax code is required", "El código del impuesto es obligatorio."],
        ["tax kind must be DEBIT or CREDIT", "El tipo de impuesto debe ser débito o crédito."],
        ["tax rate must be greater than or equal to 0", "La tarifa del impuesto no puede ser negativa."],
        [
            "tax code is repeated in the same item",
            "Hay un código de impuesto repetido en la misma línea. Cada impuesto de una línea debe tener un código distinto.",
        ],
    ])("traduce el mensaje de impuestos %s", (message, expected) => {
        expect(translateBackendMessage(message)).toBe(expected);
    });

    it("todas las claves están en minúsculas y sin espacios a los lados (si no, nunca coincidirían)", () => {
        Object.keys(KNOWN_MESSAGES).forEach((key) => expect(key).toBe(key.trim().toLowerCase()));
    });

    it("no distingue mayúsculas ni espacios a los lados", () => {
        expect(translateBackendMessage("  Tenant Code Already Exists ")).toBe("Ya existe una empresa con ese código.");
    });

    it("devuelve el mensaje original si no lo conoce", () => {
        expect(translateBackendMessage("algo inesperado")).toBe("algo inesperado");
    });
});
