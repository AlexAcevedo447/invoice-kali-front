import { describe, expect, it } from "vitest";
import { SESSION_END_MESSAGES, sessionEndReasonFor } from "./sessionEnd";

describe("sessionEndReasonFor", () => {
    it("401 cierra la sesión por vencimiento", () => {
        expect(sessionEndReasonFor(401, "invalid access token")).toBe("expired");
    });

    it("403 tenant is suspended cierra la sesión por empresa suspendida (tokens previos)", () => {
        expect(sessionEndReasonFor(403, "tenant is suspended")).toBe("tenant-suspended");
        expect(sessionEndReasonFor(403, " Tenant Is Suspended ")).toBe("tenant-suspended");
    });

    it("otros 403 no cierran la sesión (p. ej. falta de permiso)", () => {
        expect(sessionEndReasonFor(403, "platform administrator required")).toBeNull();
        expect(sessionEndReasonFor(403, undefined)).toBeNull();
    });

    it("otros códigos no cierran la sesión", () => {
        expect(sessionEndReasonFor(500, "tenant is suspended")).toBeNull();
        expect(sessionEndReasonFor(undefined, undefined)).toBeNull();
    });

    it("cada motivo tiene su mensaje", () => {
        expect(SESSION_END_MESSAGES["tenant-suspended"].summary).toBe("Empresa suspendida");
        expect(SESSION_END_MESSAGES.expired.summary).toBe("Sesión expirada");
    });
});
