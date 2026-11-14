import { describe, expect, it } from "vitest";
import {
    canAccessAdminModule,
    canManageAssignments,
    canManagePermissions,
    canManageRoles,
    canManageTenants,
    canReadPermissions,
    canReadRoles,
    permissionCovers,
} from "./access";

const perm = (resource: string, action: string) => ({ id: `${resource}:${action}`, resource, action }) as never;

describe("canManageTenants (CA-05.7, regla RBAC igual al servidor)", () => {
    it("permite a la plataforma con el permiso comodín del seed (*/*)", () => {
        expect(canManageTenants(true, [perm("*", "*")])).toBe(true);
    });

    it("permite a la plataforma con tenants/manage", () => {
        expect(canManageTenants(true, [perm("tenants", "manage")])).toBe(true);
    });

    it("permite tenants/* y */manage (comodines por parte)", () => {
        expect(canManageTenants(true, [perm("tenants", "*")])).toBe(true);
        expect(canManageTenants(true, [perm("*", "manage")])).toBe(true);
    });

    it("niega a un usuario de la plataforma con rol admin pero sin el permiso", () => {
        expect(canAccessAdminModule(["admin"], [])).toBe(true);
        expect(canManageTenants(true, [])).toBe(false);
    });

    it("niega a la plataforma con permisos que no son tenants/manage", () => {
        expect(canManageTenants(true, [perm("tenants", "read"), perm("users", "manage")])).toBe(false);
    });

    it("niega a otra empresa aunque tenga */*", () => {
        expect(canManageTenants(false, [perm("*", "*")])).toBe(false);
    });
});

describe("permisos de RBAC (misma regla que el servidor)", () => {
    it("*/* lo permite todo", () => {
        const all = [perm("*", "*")];
        expect(canReadRoles(all)).toBe(true);
        expect(canManageRoles(all)).toBe(true);
        expect(canReadPermissions(all)).toBe(true);
        expect(canManagePermissions(all)).toBe(true);
        expect(canManageAssignments(all)).toBe(true);
    });

    it("manage incluye read, pero read no incluye manage", () => {
        expect(canReadRoles([perm("roles", "manage")])).toBe(true);
        expect(canManageRoles([perm("roles", "read")])).toBe(false);
        expect(canReadRoles([perm("roles", "read")])).toBe(true);
    });

    it("comodín de recurso con acción concreta", () => {
        expect(canReadPermissions([perm("*", "read")])).toBe(true);
        expect(canManagePermissions([perm("*", "read")])).toBe(false);
        expect(canManagePermissions([perm("*", "manage")])).toBe(true);
    });

    it("comodín de acción sobre un recurso concreto", () => {
        expect(canManageAssignments([perm("rbac", "*")])).toBe(true);
        expect(canManageRoles([perm("rbac", "*")])).toBe(false);
    });

    it("no distingue mayúsculas ni espacios", () => {
        expect(canManageRoles([perm(" Roles ", "MANAGE")])).toBe(true);
    });

    it("no usa prefijos ni el rol admin: solo permisos exactos o comodín", () => {
        expect(canReadRoles([perm("roles:extra", "read")])).toBe(false);
        expect(canReadRoles([])).toBe(false);
        expect(canAccessAdminModule(["admin"], [])).toBe(true);
    });

    it("read sobre otro recurso no concede nada", () => {
        expect(canReadPermissions([perm("roles", "manage"), perm("invoices", "*")])).toBe(false);
    });

    it("permissionCovers con acciones fuera de read/manage", () => {
        expect(permissionCovers(perm("invoices", "manage"), "invoices", "delete")).toBe(false);
        expect(permissionCovers(perm("invoices", "*"), "invoices", "delete")).toBe(true);
    });
});
