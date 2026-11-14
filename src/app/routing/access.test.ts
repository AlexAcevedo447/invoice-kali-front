import { describe, expect, it } from "vitest";
import { canAccessAdminModule, canManageTenants } from "./access";

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
