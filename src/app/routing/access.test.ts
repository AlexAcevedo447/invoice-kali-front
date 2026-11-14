import { describe, expect, it } from "vitest";
import {
    canAccessAdminModule,
    canAccessInvoicingModule,
    canManageUsers,
    canManageInvoiceItems,
    canReadInvoices,
    canReadUsers,
    resolveHomeRoute,
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
        expect(canAccessAdminModule(["admin"], [])).toBe(false);
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
        expect(canAccessAdminModule(["admin"], [])).toBe(false);
    });

    it("read sobre otro recurso no concede nada", () => {
        expect(canReadPermissions([perm("roles", "manage"), perm("invoices", "*")])).toBe(false);
    });

    it("permissionCovers con acciones fuera de read/manage", () => {
        expect(permissionCovers(perm("invoices", "manage"), "invoices", "delete")).toBe(false);
        expect(permissionCovers(perm("invoices", "*"), "invoices", "delete")).toBe(true);
    });
});

describe("usuarios (CA-04.1 a CA-04.4)", () => {
    it("users/read permite ver pero no modificar", () => {
        expect(canReadUsers([perm("users", "read")])).toBe(true);
        expect(canManageUsers([perm("users", "read")])).toBe(false);
    });

    it("users/manage incluye read", () => {
        expect(canReadUsers([perm("users", "manage")])).toBe(true);
        expect(canManageUsers([perm("users", "manage")])).toBe(true);
    });

    it("comodines", () => {
        expect(canManageUsers([perm("*", "*")])).toBe(true);
        expect(canManageUsers([perm("users", "*")])).toBe(true);
        expect(canReadUsers([perm("*", "read")])).toBe(true);
        expect(canManageUsers([perm("*", "read")])).toBe(false);
    });

    it("sin permisos de usuarios no concede nada", () => {
        expect(canReadUsers([perm("roles", "manage"), perm("rbac", "manage")])).toBe(false);
    });
});

describe("menú por permisos efectivos, no por nombre de rol (CA-04.10)", () => {
    it("los nombres de rol por sí solos no conceden ningún módulo", () => {
        expect(canAccessAdminModule(["admin"], [])).toBe(false);
        expect(canAccessInvoicingModule(["invoicing"], [])).toBe(false);
        expect(canAccessInvoicingModule(["admin", "invoicing"], [])).toBe(false);
        expect(resolveHomeRoute(["admin", "invoicing"], [])).toBeNull();
    });

    it.each([
        ["users", "read"],
        ["users", "manage"],
        ["roles", "read"],
        ["permissions", "read"],
        ["rbac", "manage"],
        ["*", "*"],
        ["*", "read"],
    ])("administración con %s/%s", (resource, action) => {
        expect(canAccessAdminModule([], [perm(resource, action)])).toBe(true);
    });

    it.each([
        ["invoices", "manage"],
        ["tenants", "read"],
        ["rbac", "read"],
        // tenants/manage fuera de la empresa de plataforma no lleva a ninguna página.
        ["tenants", "manage"],
    ])("administración no se concede con %s/%s", (resource, action) => {
        expect(canAccessAdminModule([], [perm(resource, action)])).toBe(false);
    });

    it.each([
        ["invoices", "read"],
        ["invoices", "manage"],
        ["invoices", "*"],
        ["invoice-items", "read"],
        ["customers", "read"],
        ["products", "manage"],
        ["*", "read"],
    ])("facturación con %s/%s", (resource, action) => {
        expect(canAccessInvoicingModule([], [perm(resource, action)])).toBe(true);
    });

    it("facturación no se concede con permisos de administración ni con metrics", () => {
        expect(canAccessInvoicingModule([], [perm("users", "manage"), perm("rbac", "manage")])).toBe(false);
        expect(canAccessInvoicingModule([], [perm("metrics", "read")])).toBe(false);
    });

    it("no usa prefijos de recurso", () => {
        expect(canAccessInvoicingModule([], [perm("invoices:extra", "read")])).toBe(false);
        expect(canAccessAdminModule([], [perm("users.extra", "read")])).toBe(false);
    });
});

describe("resolveHomeRoute", () => {
    it("prefiere facturas", () => {
        expect(resolveHomeRoute([], [perm("*", "*")])).toBe("/invoicing/invoices");
        expect(resolveHomeRoute([], [perm("invoices", "read"), perm("users", "read")])).toBe("/invoicing/invoices");
    });

    it("lleva a la primera pantalla de facturación legible", () => {
        expect(resolveHomeRoute([], [perm("customers", "read")])).toBe("/invoicing/customers");
        expect(resolveHomeRoute([], [perm("products", "manage")])).toBe("/invoicing/products");
        expect(resolveHomeRoute([], [perm("invoice-items", "read")])).toBe("/invoicing/invoice-items");
    });

    it("sin facturación va a administración", () => {
        expect(resolveHomeRoute([], [perm("users", "read")])).toBe("/admin/users");
        expect(resolveHomeRoute([], [perm("roles", "read")])).toBe("/admin/roles");
        expect(resolveHomeRoute([], [perm("permissions", "read")])).toBe("/admin/permissions");
    });

    it("cada permiso llega a su funcionalidad sin exigir permisos ajenos", () => {
        // rbac/manage → asignaciones (en Roles)
        expect(resolveHomeRoute([], [perm("rbac", "manage")])).toBe("/admin/roles");
        // tenants/manage → Empresas, solo en la empresa de plataforma
        expect(canAccessAdminModule([], [perm("tenants", "manage")], true)).toBe(true);
        expect(resolveHomeRoute([], [perm("tenants", "manage")], true)).toBe("/admin/tenants");
        expect(resolveHomeRoute([], [perm("tenants", "manage")], false)).toBeNull();
    });

    it("sin permisos no hay inicio", () => {
        expect(resolveHomeRoute(["admin"], [])).toBeNull();
    });
});

describe("canManageInvoiceItems (D4-05: líneas e impuestos de una factura existente)", () => {
    it("permite con invoice-items/manage y comodines", () => {
        expect(canManageInvoiceItems([perm("invoice-items", "manage")])).toBe(true);
        expect(canManageInvoiceItems([perm(" Invoice-Items ", " MANAGE ")])).toBe(true);
        expect(canManageInvoiceItems([perm("invoice-items", "*")])).toBe(true);
        expect(canManageInvoiceItems([perm("*", "manage")])).toBe(true);
        expect(canManageInvoiceItems([perm("*", "*")])).toBe(true);
    });

    it("invoices/manage no basta para editar líneas existentes", () => {
        expect(canManageInvoiceItems([perm("invoices", "manage")])).toBe(false);
    });

    it("invoice-items/read no permite gestionar", () => {
        expect(canManageInvoiceItems([perm("invoice-items", "read")])).toBe(false);
        expect(canManageInvoiceItems([])).toBe(false);
    });
});

describe("canReadInvoices (vista de solo lectura de la factura)", () => {
    it("permite con invoices/read o invoices/manage", () => {
        expect(canReadInvoices([perm("invoices", "read")])).toBe(true);
        expect(canReadInvoices([perm("invoices", "manage")])).toBe(true);
    });

    it("no la concede invoice-items/manage", () => {
        expect(canReadInvoices([perm("invoice-items", "manage")])).toBe(false);
    });
});
