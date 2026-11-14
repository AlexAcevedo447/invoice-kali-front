import { describe, expect, it } from "vitest";
import { createUserSchema, editUserSchema } from "./userForm.schema";
import { fieldErrors } from "./tenantForm.schema";

const valid = {
    identificationNumber: " 123 ",
    username: "  ana ",
    email: "  ana@acme.com ",
    password: "Str0ng!Passw0rd",
};

describe("createUserSchema", () => {
    it("exige todos los campos (sin contar espacios)", () => {
        const result = createUserSchema.safeParse({ identificationNumber: " ", username: "", email: "  ", password: "   " });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(fieldErrors(result.error)).toEqual({
                identificationNumber: "La identificación es obligatoria.",
                username: "El nombre de usuario es obligatorio.",
                email: "El correo es obligatorio.",
                password: "La contraseña es obligatoria.",
            });
        }
    });

    it("valida el formato del correo", () => {
        const result = createUserSchema.safeParse({ ...valid, email: "no-es-correo" });
        expect(result.success).toBe(false);
        if (!result.success) expect(fieldErrors(result.error).email).toBe("Ingresa un correo válido.");
    });

    it("recorta identificación, usuario y correo; no modifica la contraseña", () => {
        expect(createUserSchema.parse(valid)).toEqual({
            identificationNumber: "123",
            username: "ana",
            email: "ana@acme.com",
            password: "Str0ng!Passw0rd",
            roleId: undefined,
        });
    });

    it("el rol es opcional", () => {
        expect(createUserSchema.parse({ ...valid, roleId: "" }).roleId).toBeUndefined();
        expect(createUserSchema.parse({ ...valid, roleId: " r-1 " }).roleId).toBe("r-1");
    });

    it("deja la política de contraseña al servidor (solo exige que no esté vacía)", () => {
        expect(createUserSchema.safeParse({ ...valid, password: "abc" }).success).toBe(true);
    });
});

describe("editUserSchema", () => {
    it("la contraseña es opcional: vacía u omitida se conserva", () => {
        expect(editUserSchema.parse({ ...valid, password: "" }).password).toBeUndefined();
        expect(
            editUserSchema.parse({ identificationNumber: "1", username: "ana", email: "ana@acme.com" }).password,
        ).toBeUndefined();
    });

    it("si se indica, se envía tal cual", () => {
        expect(editUserSchema.parse({ ...valid, password: "N3w!Password12" }).password).toBe("N3w!Password12");
    });

    it("rechaza una contraseña de solo espacios", () => {
        const result = editUserSchema.safeParse({ ...valid, password: "   " });
        expect(result.success).toBe(false);
        if (!result.success) expect(fieldErrors(result.error).password).toContain("solo espacios");
    });

    it("exige identificación, usuario y correo válidos y los recorta", () => {
        expect(editUserSchema.safeParse({ ...valid, username: "  " }).success).toBe(false);
        expect(editUserSchema.safeParse({ ...valid, email: "x@" }).success).toBe(false);
        expect(editUserSchema.parse(valid)).toMatchObject({ identificationNumber: "123", username: "ana", email: "ana@acme.com" });
    });
});
