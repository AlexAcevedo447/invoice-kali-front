import { describe, expect, it, vi } from "vitest";
import type { HttpClient } from "@shared/application/http/HttpClient";
import { toUserId } from "@modules/auth-context/domain/value-objects/UserId";
import { HttpUserRepository } from "./HttpUserRepository";
import { mapUserApiToDomain, type ApiUser } from "../mappers/authContextMapper";

const apiUser: ApiUser = {
    Id: "u-1",
    TenantId: "t-1",
    IdentificationNumber: "123",
    Username: "ana",
    Email: "ana@acme.com",
};

const domainUser = {
    id: "u-1",
    tenantId: "t-1",
    identificationNumber: "123",
    username: "ana",
    email: "ana@acme.com",
};

const fakeClient = () =>
    ({
        get: vi.fn().mockResolvedValue([apiUser]),
        getWithMeta: vi.fn(),
        post: vi.fn().mockResolvedValue(apiUser),
        put: vi.fn().mockResolvedValue(undefined),
        patch: vi.fn(),
        delete: vi.fn().mockResolvedValue(undefined),
    }) satisfies HttpClient;

const options = { accessToken: "tok", idempotencyKey: "key-1" };
const authHeader = expect.objectContaining({
    headers: expect.objectContaining({ Authorization: "Bearer tok" }),
});

describe("HttpUserRepository", () => {
    it("lista sin tenant_id (la empresa sale del token) y mapea los usuarios", async () => {
        const client = fakeClient();
        const list = await new HttpUserRepository(client).list({ accessToken: "tok" });
        expect(client.get).toHaveBeenCalledWith("/api/v1/users", authHeader);
        expect(list).toEqual([domainUser]);
    });

    it("tolera una lista vacía como null", async () => {
        const client = fakeClient();
        client.get.mockResolvedValue(null);
        expect(await new HttpUserRepository(client).list({ accessToken: "tok" })).toEqual([]);
    });

    it("consulta por id y por correo sin tenant_id", async () => {
        const client = fakeClient();
        client.get.mockResolvedValue(apiUser);
        const repository = new HttpUserRepository(client);
        expect(await repository.getById({ userId: toUserId("u/1") }, { accessToken: "tok" })).toEqual(domainUser);
        expect(client.get).toHaveBeenLastCalledWith("/api/v1/users/u%2F1", authHeader);
        expect(await repository.getByEmail({ email: "ana+1@acme.com" }, { accessToken: "tok" })).toEqual(domainUser);
        expect(client.get).toHaveBeenLastCalledWith("/api/v1/users/by-email?email=ana%2B1%40acme.com", authHeader);
    });

    it("crea sin tenant_id, con idempotencia, y devuelve el usuario creado", async () => {
        const client = fakeClient();
        const created = await new HttpUserRepository(client).create(
            { identificationNumber: "123", username: "ana", email: "ana@acme.com", password: "Str0ng!Passw0rd" },
            options,
        );
        expect(client.post).toHaveBeenCalledWith(
            "/api/v1/users",
            { identification_number: "123", username: "ana", email: "ana@acme.com", password: "Str0ng!Passw0rd" },
            expect.objectContaining({ idempotencyKey: "key-1", headers: expect.objectContaining({ Authorization: "Bearer tok" }) }),
        );
        expect(created).toEqual(domainUser);
    });

    it("edita enviando la contraseña cuando se indica", async () => {
        const client = fakeClient();
        await new HttpUserRepository(client).update(
            {
                userId: toUserId("u-1"),
                identificationNumber: "123",
                username: "ana",
                email: "ana@acme.com",
                password: "N3w!Password12",
            },
            options,
        );
        expect(client.put).toHaveBeenCalledWith(
            "/api/v1/users/u-1",
            { identification_number: "123", username: "ana", email: "ana@acme.com", password: "N3w!Password12" },
            expect.objectContaining({ idempotencyKey: "key-1" }),
        );
    });

    it.each([undefined, "", "   "])("edita sin contraseña (%j): no envía el campo y el servidor conserva la actual", async (password) => {
        const client = fakeClient();
        await new HttpUserRepository(client).update(
            { userId: toUserId("u-1"), identificationNumber: "123", username: "ana", email: "ana@acme.com", password },
            options,
        );
        const body = client.put.mock.calls[0][1];
        expect(body).toEqual({ identification_number: "123", username: "ana", email: "ana@acme.com" });
        expect(body).not.toHaveProperty("password");
        expect(body).not.toHaveProperty("tenant_id");
    });

    it("elimina sin tenant_id y con idempotencia", async () => {
        const client = fakeClient();
        await new HttpUserRepository(client).delete({ userId: toUserId("u-1") }, options);
        expect(client.delete).toHaveBeenCalledWith(
            "/api/v1/users/u-1",
            expect.objectContaining({ idempotencyKey: "key-1" }),
        );
    });
});

describe("mapUserApiToDomain", () => {
    it("ignora Password aunque llegue en la respuesta", () => {
        const mapped = mapUserApiToDomain({ ...apiUser, Password: "$argon2id$v=19$..." } as ApiUser);
        expect(mapped).toEqual(domainUser);
        expect(mapped).not.toHaveProperty("password");
        expect(mapped).not.toHaveProperty("Password");
        expect(JSON.stringify(mapped)).not.toContain("argon2");
    });
});
