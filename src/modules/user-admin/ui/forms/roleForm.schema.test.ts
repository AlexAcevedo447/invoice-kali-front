import { describe, expect, it } from "vitest";
import { roleNameKey, roleSchema } from "./roleForm.schema";
import { fieldErrors } from "./tenantForm.schema";

describe("roleSchema", () => {
    it("exige el nombre sin contar espacios", () => {
        const result = roleSchema.safeParse({ name: "   ", description: "" });
        expect(result.success).toBe(false);
        if (!result.success) expect(fieldErrors(result.error).name).toBe("El nombre del rol es obligatorio.");
    });

    it("recorta nombre y descripción", () => {
        expect(roleSchema.parse({ name: "  Facturación ", description: "  Emite facturas  " })).toEqual({
            name: "Facturación",
            description: "Emite facturas",
        });
    });

    it("la descripción es opcional", () => {
        expect(roleSchema.parse({ name: "auditor" })).toEqual({ name: "auditor", description: "" });
        expect(roleSchema.parse({ name: "auditor", description: "   " }).description).toBe("");
    });
});

describe("roleNameKey", () => {
    it("compara sin mayúsculas ni espacios exteriores (igual que la unicidad del servidor)", () => {
        expect(roleNameKey("  Admin ")).toBe(roleNameKey("admin"));
    });
});
