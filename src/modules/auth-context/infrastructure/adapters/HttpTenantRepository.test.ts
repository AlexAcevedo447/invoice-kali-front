import { describe, expect, it, vi } from "vitest";
import type { HttpClient } from "@shared/application/http/HttpClient";
import { toTenantId } from "@modules/auth-context/domain/value-objects/TenantId";
import { HttpTenantRepository } from "./HttpTenantRepository";
import {
    mapAuthSessionApiToDomain,
    mapTenantApiToDomain,
    type ApiAuthSessionResponse,
} from "../mappers/authContextMapper";

const apiTenant = { Id: "t-1", Name: "Acme", Code: "acme", Status: "ACTIVE" as const };

const fakeClient = () =>
    ({
        get: vi.fn().mockResolvedValue([apiTenant]),
        getWithMeta: vi.fn(),
        post: vi.fn().mockResolvedValue(apiTenant),
        put: vi.fn().mockResolvedValue(undefined),
        patch: vi.fn(),
        delete: vi.fn(),
    }) satisfies HttpClient;

const options = { accessToken: "tok", idempotencyKey: "key-1" };

describe("HttpTenantRepository", () => {
    it("crea sin código cuando no se indica (el servidor lo deriva) y devuelve la empresa creada", async () => {
        const client = fakeClient();
        const created = await new HttpTenantRepository(client).create({ name: "Acme" }, options);
        expect(client.post).toHaveBeenCalledWith(
            "/api/v1/tenants",
            { name: "Acme" },
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: "Bearer tok" }),
                idempotencyKey: "key-1",
            }),
        );
        expect(created).toEqual({ id: "t-1", name: "Acme", code: "acme", status: "ACTIVE" });
    });

    it("envía el código cuando se indica", async () => {
        const client = fakeClient();
        await new HttpTenantRepository(client).create({ name: "Acme", code: "acme-01" }, options);
        expect(client.post.mock.calls[0][1]).toEqual({ name: "Acme", code: "acme-01" });
    });

    it("al editar envía nombre, código y el estado actual (editar no cambia el estado)", async () => {
        const client = fakeClient();
        await new HttpTenantRepository(client).update(
            { tenantId: toTenantId("t-1"), name: "Acme 2", code: "acme-2", status: "SUSPENDED" },
            options,
        );
        expect(client.put).toHaveBeenCalledWith(
            "/api/v1/tenants/t-1",
            { name: "Acme 2", code: "acme-2", status: "SUSPENDED" },
            expect.anything(),
        );
    });

    it("lista y mapea el código", async () => {
        const client = fakeClient();
        const list = await new HttpTenantRepository(client).list({ accessToken: "tok" });
        expect(list).toEqual([{ id: "t-1", name: "Acme", code: "acme", status: "ACTIVE" }]);
    });
});

describe("mappers de empresas y sesión", () => {
    it("tolera una respuesta de empresa sin código", () => {
        expect(mapTenantApiToDomain({ Id: "t", Name: "N", Status: "ACTIVE" } as never).code).toBe("");
    });

    const session = (extra: Partial<ApiAuthSessionResponse>): ApiAuthSessionResponse =>
        ({
            access_token: "a",
            token_type: "Bearer",
            expires_in: 3600,
            tenant_id: "t",
            tenant_name: "T",
            tenant_code: "t",
            user_id: "u",
            email: "e@x.com",
            needs_rehash: false,
            roles: [],
            permissions: [],
            ...extra,
        }) as ApiAuthSessionResponse;

    it("is_platform_tenant ausente se interpreta como false", () => {
        expect(mapAuthSessionApiToDomain(session({})).isPlatformTenant).toBe(false);
    });

    it("is_platform_tenant true se conserva", () => {
        expect(mapAuthSessionApiToDomain(session({ is_platform_tenant: true })).isPlatformTenant).toBe(true);
    });
});
