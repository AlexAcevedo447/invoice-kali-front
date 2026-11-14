import { describe, expect, it } from "vitest";
import type { PermissionCatalog } from "@modules/auth-context/domain/entities/PermissionCatalog";
import {
    actionOptions,
    createPermissionSchema,
    normalizePermissionPart,
    permissionLabel,
    resourceOptions,
} from "./permissionForm.schema";
import { fieldErrors } from "./tenantForm.schema";

const catalog: PermissionCatalog = {
    resources: [
        { resource: "invoices", actions: ["read", "manage"] },
        { resource: "rbac", actions: ["manage"] },
        { resource: "tenants", actions: ["manage"] },
    ],
};

const schema = createPermissionSchema(catalog);

const errorsOf = (input: { resource: string; action: string }) => {
    const result = schema.safeParse(input);
    if (result.success) throw new Error("se esperaba un error de validación");
    return fieldErrors(result.error);
};

describe("normalizePermissionPart", () => {
    it("recorta y pasa a minúsculas", () => {
        expect(normalizePermissionPart("  Invoices ")).toBe("invoices");
    });
});

describe("opciones del catálogo", () => {
    it("los recursos incluyen el comodín primero", () => {
        expect(resourceOptions(catalog)).toEqual(["*", "invoices", "rbac", "tenants"]);
    });

    it("las acciones de un recurso incluyen el comodín y las del catálogo", () => {
        expect(actionOptions(catalog, "invoices")).toEqual(["*", "read", "manage"]);
        expect(actionOptions(catalog, "rbac")).toEqual(["*", "manage"]);
    });

    it('con recurso "*" solo se ofrecen "*", "read" y "manage"', () => {
        expect(actionOptions(catalog, "*")).toEqual(["*", "read", "manage"]);
    });

    it("un recurso desconocido no tiene acciones", () => {
        expect(actionOptions(catalog, "metrics")).toEqual([]);
    });
});

describe("createPermissionSchema", () => {
    it("normaliza recurso y acción", () => {
        expect(schema.parse({ resource: " INVOICES ", action: "Read " })).toEqual({
            resource: "invoices",
            action: "read",
        });
    });

    it("exige recurso y acción", () => {
        expect(errorsOf({ resource: " ", action: "" })).toEqual({
            resource: "El recurso es obligatorio.",
            action: "La acción es obligatoria.",
        });
    });

    it("rechaza un recurso fuera del catálogo", () => {
        expect(errorsOf({ resource: "metrics", action: "read" }).resource).toBe(
            "El recurso no está en el catálogo de permisos.",
        );
    });

    it("rechaza una acción que el recurso no tiene", () => {
        expect(errorsOf({ resource: "rbac", action: "read" }).action).toBe(
            'La acción no es válida para el recurso "rbac".',
        );
    });

    it("acepta comodines en recurso, acción o ambos", () => {
        expect(schema.safeParse({ resource: "*", action: "*" }).success).toBe(true);
        expect(schema.safeParse({ resource: "invoices", action: "*" }).success).toBe(true);
        expect(schema.safeParse({ resource: "*", action: "read" }).success).toBe(true);
        expect(schema.safeParse({ resource: "*", action: "manage" }).success).toBe(true);
    });

    it('con recurso "*" la acción debe ser "*", "read" o "manage"', () => {
        expect(errorsOf({ resource: "*", action: "delete" }).action).toBe(
            'Con el recurso "*" la acción debe ser "*", "read" o "manage".',
        );
    });

    it("con un catálogo vacío solo se acepta el comodín de recurso", () => {
        const empty = createPermissionSchema({ resources: [] });
        expect(empty.safeParse({ resource: "*", action: "read" }).success).toBe(true);
        expect(empty.safeParse({ resource: "invoices", action: "read" }).success).toBe(false);
    });
});

describe("permissionLabel", () => {
    it("muestra recurso/acción", () => {
        expect(permissionLabel({ resource: "invoices", action: "read" })).toBe("invoices/read");
    });
});
