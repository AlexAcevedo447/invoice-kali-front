import { describe, expect, it } from "vitest";
import { translateBackendMessage } from "./backendMessages";

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

    it("no distingue mayúsculas ni espacios a los lados", () => {
        expect(translateBackendMessage("  Tenant Code Already Exists ")).toBe("Ya existe una empresa con ese código.");
    });

    it("devuelve el mensaje original si no lo conoce", () => {
        expect(translateBackendMessage("algo inesperado")).toBe("algo inesperado");
    });
});
