import { describe, expect, it, vi } from "vitest";
import type { HttpClient } from "@shared/application/http/HttpClient";
import { toPermissionId } from "@modules/auth-context/domain/value-objects/PermissionId";
import { toRoleId } from "@modules/auth-context/domain/value-objects/RoleId";
import { toUserId } from "@modules/auth-context/domain/value-objects/UserId";
import { HttpRoleRepository } from "./HttpRoleRepository";
import { HttpPermissionRepository } from "./HttpPermissionRepository";
import { HttpRbacRepository } from "./HttpRbacRepository";
import {
    mapPermissionCatalogApiToDomain,
    mapRolePermissionLinksToPermissionIds,
    mapUserRoleLinksToRoleIds,
} from "../mappers/authContextMapper";

const apiRole = { Id: "r-1", TenantId: "t-1", Name: "Auditor", Description: "Solo lectura" };
const apiPermission = { Id: "p-1", TenantId: "t-1", Resource: "invoices", Action: "read" };

const fakeClient = (getResult: unknown = [], postResult: unknown = undefined) =>
    ({
        get: vi.fn().mockResolvedValue(getResult),
        getWithMeta: vi.fn(),
        post: vi.fn().mockResolvedValue(postResult),
        put: vi.fn().mockResolvedValue(undefined),
        patch: vi.fn(),
        delete: vi.fn().mockResolvedValue(undefined),
    }) satisfies HttpClient;

const read = { accessToken: "tok" };
const write = { accessToken: "tok", idempotencyKey: "key-1" };
const idempotentConfig = expect.objectContaining({
    headers: expect.objectContaining({ Authorization: "Bearer tok" }),
    idempotencyKey: "key-1",
});

describe("HttpRoleRepository", () => {
    it("crea sin tenant_id (la empresa sale del token) y devuelve el rol creado", async () => {
        const client = fakeClient([], apiRole);
        const created = await new HttpRoleRepository(client).create({ name: "Auditor", description: "Solo lectura" }, write);
        expect(client.post).toHaveBeenCalledWith(
            "/api/v1/roles",
            { name: "Auditor", description: "Solo lectura" },
            idempotentConfig,
        );
        expect(created).toEqual({ id: "r-1", tenantId: "t-1", name: "Auditor", description: "Solo lectura" });
    });

    it("lista sin tenant_id y tolera una respuesta null", async () => {
        const client = fakeClient([apiRole]);
        expect(await new HttpRoleRepository(client).list(read)).toHaveLength(1);
        expect(client.get.mock.calls[0][0]).toBe("/api/v1/roles");
        client.get.mockResolvedValueOnce(null);
        expect(await new HttpRoleRepository(client).list(read)).toEqual([]);
    });

    it("edita con nombre y descripción", async () => {
        const client = fakeClient();
        await new HttpRoleRepository(client).update(
            { roleId: toRoleId("r 1"), name: "Auditor", description: "" },
            write,
        );
        expect(client.put).toHaveBeenCalledWith(
            "/api/v1/roles/r%201",
            { name: "Auditor", description: "" },
            idempotentConfig,
        );
    });

    it("elimina con clave de idempotencia", async () => {
        const client = fakeClient();
        await new HttpRoleRepository(client).delete({ roleId: toRoleId("r-1") }, write);
        expect(client.delete).toHaveBeenCalledWith("/api/v1/roles/r-1", idempotentConfig);
    });
});

describe("HttpPermissionRepository", () => {
    it("crea sin tenant_id y devuelve el permiso creado", async () => {
        const client = fakeClient([], apiPermission);
        const created = await new HttpPermissionRepository(client).create({ resource: "invoices", action: "read" }, write);
        expect(client.post).toHaveBeenCalledWith(
            "/api/v1/permissions",
            { resource: "invoices", action: "read" },
            idempotentConfig,
        );
        expect(created).toEqual({ id: "p-1", tenantId: "t-1", resource: "invoices", action: "read" });
    });

    it("lista sin tenant_id", async () => {
        const client = fakeClient([apiPermission]);
        const list = await new HttpPermissionRepository(client).list(read);
        expect(client.get.mock.calls[0][0]).toBe("/api/v1/permissions");
        expect(list[0].resource).toBe("invoices");
    });

    it("consulta el catálogo y lo normaliza", async () => {
        const client = fakeClient({ resources: [{ resource: " Invoices ", actions: ["READ", "manage"] }] });
        const catalog = await new HttpPermissionRepository(client).catalog(read);
        expect(client.get.mock.calls[0][0]).toBe("/api/v1/permissions/catalog");
        expect(catalog).toEqual({ resources: [{ resource: "invoices", actions: ["read", "manage"] }] });
    });

    it("edita y elimina por id", async () => {
        const client = fakeClient();
        const repo = new HttpPermissionRepository(client);
        await repo.update({ permissionId: toPermissionId("p-1"), resource: "*", action: "read" }, write);
        expect(client.put).toHaveBeenCalledWith("/api/v1/permissions/p-1", { resource: "*", action: "read" }, idempotentConfig);
        await repo.delete({ permissionId: toPermissionId("p-1") }, write);
        expect(client.delete).toHaveBeenCalledWith("/api/v1/permissions/p-1", idempotentConfig);
    });
});

describe("HttpRbacRepository", () => {
    it("asigna y quita roles a usuarios sin tenant_id y con idempotencia", async () => {
        const client = fakeClient();
        const repo = new HttpRbacRepository(client);
        await repo.assignUserRole({ userId: toUserId("u-1"), roleId: toRoleId("r-1") }, write);
        await repo.removeUserRole({ userId: toUserId("u-1"), roleId: toRoleId("r-1") }, write);
        expect(client.post).toHaveBeenNthCalledWith(
            1,
            "/api/v1/rbac/users/roles/assign",
            { user_id: "u-1", role_id: "r-1" },
            idempotentConfig,
        );
        expect(client.post).toHaveBeenNthCalledWith(
            2,
            "/api/v1/rbac/users/roles/remove",
            { user_id: "u-1", role_id: "r-1" },
            idempotentConfig,
        );
    });

    it("asigna y quita permisos a roles", async () => {
        const client = fakeClient();
        const repo = new HttpRbacRepository(client);
        await repo.assignRolePermission({ roleId: toRoleId("r-1"), permissionId: toPermissionId("p-1") }, write);
        await repo.removeRolePermission({ roleId: toRoleId("r-1"), permissionId: toPermissionId("p-1") }, write);
        expect(client.post.mock.calls[0].slice(0, 2)).toEqual([
            "/api/v1/rbac/roles/permissions/assign",
            { role_id: "r-1", permission_id: "p-1" },
        ]);
        expect(client.post.mock.calls[1].slice(0, 2)).toEqual([
            "/api/v1/rbac/roles/permissions/remove",
            { role_id: "r-1", permission_id: "p-1" },
        ]);
    });

    it("devuelve los ids de los roles de un usuario a partir de los vínculos", async () => {
        const client = fakeClient([
            { TenantId: "t-1", UserId: "u-1", RoleId: "r-1" },
            { TenantId: "t-1", UserId: "u-1", RoleId: "r-2" },
        ]);
        const ids = await new HttpRbacRepository(client).getUserRoles({ userId: toUserId("u 1") }, read);
        expect(client.get.mock.calls[0][0]).toBe("/api/v1/rbac/users/roles?user_id=u%201");
        expect(ids).toEqual(["r-1", "r-2"]);
    });

    it("devuelve los ids de los permisos de un rol a partir de los vínculos", async () => {
        const client = fakeClient([{ TenantId: "t-1", RoleId: "r-1", PermissionId: "p-1" }]);
        const ids = await new HttpRbacRepository(client).getRolePermissions({ roleId: toRoleId("r-1") }, read);
        expect(client.get.mock.calls[0][0]).toBe("/api/v1/rbac/roles/permissions?role_id=r-1");
        expect(ids).toEqual(["p-1"]);
    });
});

describe("mappers de RBAC", () => {
    it("los vínculos toleran null, duplicados y entidades completas", () => {
        expect(mapUserRoleLinksToRoleIds(null)).toEqual([]);
        expect(mapUserRoleLinksToRoleIds([{ RoleId: "r-1" }, { RoleId: "r-1" }, { Id: "r-2" }])).toEqual(["r-1", "r-2"]);
        expect(mapRolePermissionLinksToPermissionIds([{ PermissionId: "p-1" }, {}])).toEqual(["p-1"]);
    });

    it("el catálogo tolera respuestas vacías", () => {
        expect(mapPermissionCatalogApiToDomain(null)).toEqual({ resources: [] });
        expect(mapPermissionCatalogApiToDomain({ resources: [{ resource: "rbac", actions: null }] })).toEqual({
            resources: [{ resource: "rbac", actions: [] }],
        });
    });
});
