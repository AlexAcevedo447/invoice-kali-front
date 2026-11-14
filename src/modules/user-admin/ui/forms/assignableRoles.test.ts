import { describe, expect, it } from "vitest";
import { assignableRoles } from "./assignableRoles";

const roles = [{ id: "admin" }, { id: "facturacion" }, { id: "vacio" }, { id: "desconocido" }];
const permissionsById = new Map([
    ["p-all", { resource: "*", action: "*" }],
    ["p-inv", { resource: "invoices", action: "manage" }],
    ["p-cus", { resource: "customers", action: "read" }],
]);
const links = new Map<string, string[]>([
    ["admin", ["p-all"]],
    ["facturacion", ["p-inv", "p-cus"]],
    ["vacio", []],
    ["desconocido", ["p-x"]],
]);

const ids = (list: { id: string }[]) => list.map((role) => role.id);

describe("assignableRoles", () => {
    it("con */* ofrece todos los roles con permisos conocidos", () => {
        expect(ids(assignableRoles(roles, links, permissionsById, [{ resource: "*", action: "*" }]))).toEqual([
            "admin",
            "facturacion",
        ]);
    });

    it("no ofrece roles con permisos que la sesión no cubre", () => {
        const session = [
            { resource: "invoices", action: "manage" },
            { resource: "customers", action: "manage" },
        ];
        expect(ids(assignableRoles(roles, links, permissionsById, session))).toEqual(["facturacion"]);
    });

    it("read no cubre manage", () => {
        const session = [
            { resource: "invoices", action: "read" },
            { resource: "customers", action: "read" },
        ];
        expect(assignableRoles(roles, links, permissionsById, session)).toEqual([]);
    });

    it("excluye roles sin permisos o con permisos desconocidos", () => {
        const result = ids(assignableRoles(roles, links, permissionsById, [{ resource: "*", action: "*" }]));
        expect(result).not.toContain("vacio");
        expect(result).not.toContain("desconocido");
    });
});
