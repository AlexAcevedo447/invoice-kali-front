import { describe, expect, it } from "vitest";
import {
    TENANT_CODE_PATTERN,
    createTenantSchema,
    editTenantSchema,
    fieldErrors,
    normalizeTenantCode,
} from "./tenantForm.schema";

describe("TENANT_CODE_PATTERN (mismo formato que kali-auth-context)", () => {
    it.each(["acme", "abc", "empresa-demo", "a1-b2", "x".repeat(40)])("acepta %s", (code) => {
        expect(TENANT_CODE_PATTERN.test(code)).toBe(true);
    });

    it.each(["ab", "x".repeat(41), "-acme", "acme-", "Acme", "acme sa", "acme_sa", "ñandu"])(
        "rechaza %s",
        (code) => {
            expect(TENANT_CODE_PATTERN.test(code)).toBe(false);
        },
    );
});

describe("createTenantSchema", () => {
    it("exige nombre (sin contar espacios)", () => {
        const result = createTenantSchema.safeParse({ name: "   ", code: "" });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(fieldErrors(result.error).name).toBe("El nombre de la empresa es obligatorio.");
        }
    });

    it("el código es opcional: vacío se omite para que el servidor lo derive", () => {
        const result = createTenantSchema.parse({ name: "  Acme S.A.S.  ", code: "" });
        expect(result).toEqual({ name: "Acme S.A.S.", code: undefined });
    });

    it("normaliza el código a minúsculas y sin espacios", () => {
        expect(createTenantSchema.parse({ name: "Acme", code: "  ACME-01 " }).code).toBe("acme-01");
    });

    it("rechaza un código con formato inválido", () => {
        const result = createTenantSchema.safeParse({ name: "Acme", code: "acme sa" });
        expect(result.success).toBe(false);
        if (!result.success) expect(fieldErrors(result.error).code).toMatch(/^Código inválido/);
    });
});

describe("editTenantSchema", () => {
    it("exige código al editar", () => {
        const result = editTenantSchema.safeParse({ name: "Acme", code: "" });
        expect(result.success).toBe(false);
        if (!result.success) expect(fieldErrors(result.error).code).toMatch(/^Código inválido/);
    });

    it("acepta nombre y código válidos", () => {
        expect(editTenantSchema.parse({ name: "Acme", code: "Acme" })).toEqual({ name: "Acme", code: "acme" });
    });
});

describe("normalizeTenantCode", () => {
    it("recorta y pasa a minúsculas", () => {
        expect(normalizeTenantCode("  Demo-SENA ")).toBe("demo-sena");
    });
});
