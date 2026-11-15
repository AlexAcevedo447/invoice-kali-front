import { describe, expect, it } from "vitest";
import { KNOWN_MESSAGES } from "@shared/application/http/backendMessages";
import { createUserSchema, editUserSchema, PASSWORD_POLICY_MESSAGES, passwordPolicyError } from "./userForm.schema";
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

    it("aplica la política de contraseña antes de enviar", () => {
        const result = createUserSchema.safeParse({ ...valid, password: "abc" });
        expect(result.success).toBe(false);
        if (!result.success) expect(fieldErrors(result.error).password).toBe(PASSWORD_POLICY_MESSAGES.tooShort);
    });

    it("no recorta la contraseña: un espacio exterior es un espacio", () => {
        const result = createUserSchema.safeParse({ ...valid, password: " Str0ng!Passw0rd" });
        expect(result.success).toBe(false);
        if (!result.success) expect(fieldErrors(result.error).password).toBe(PASSWORD_POLICY_MESSAGES.whitespace);
    });
});

describe("passwordPolicyError (igual que kali-auth-context)", () => {
    it("usa los mismos mensajes traducidos del servidor", () => {
        expect(PASSWORD_POLICY_MESSAGES).toEqual({
            tooShort: "La contraseña debe tener al menos 12 caracteres.",
            whitespace: "La contraseña no debe contener espacios.",
            missingUpper: "La contraseña debe incluir al menos una letra mayúscula.",
            missingLower: "La contraseña debe incluir al menos una letra minúscula.",
            missingDigit: "La contraseña debe incluir al menos un número.",
            missingSymbol: "La contraseña debe incluir al menos un símbolo.",
        });
        expect(PASSWORD_POLICY_MESSAGES.tooShort).toBe(KNOWN_MESSAGES["password must have at least 12 characters"]);
    });

    it.each([
        "Str0ng!Passw0rd",
        "Ñandú#Clave1",
        "Clave#2026😀x",
        "Clave2026Abc+",
        "Clave2026Abc€",
        "Clave#Abcde٣",
        "ÁRBOL#árbol12",
    ])("acepta %j", (password) => {
        expect(passwordPolicyError(password)).toBeNull();
    });

    it("cuenta caracteres Unicode (code points), no bytes ni unidades UTF-16", () => {
        // 11 caracteres, 13 bytes en UTF-8.
        expect(new TextEncoder().encode("Ñandú#Clav1").length).toBe(13);
        expect(passwordPolicyError("Ñandú#Clav1")).toBe(PASSWORD_POLICY_MESSAGES.tooShort);
        expect(passwordPolicyError("Ñandú#Clave1")).toBeNull();
        // 11 code points pero 12 unidades UTF-16 (el emoji ocupa 2).
        expect("Clave#2026😀".length).toBe(12);
        expect(passwordPolicyError("Clave#2026😀")).toBe(PASSWORD_POLICY_MESSAGES.tooShort);
        expect(passwordPolicyError("Clave#2026😀x")).toBeNull();
    });

    it.each([
        ["Clave#2026 Abc", "espacio"],
        ["Clave#2026\u00a0Abc", "NBSP"],
        ["Clave#2026\tAbc", "tabulador"],
        ["Clave#2026\nAbc", "salto de línea"],
        ["Clave#2026\u3000Abc", "espacio ideográfico"],
        ["Clave#2026\u2028Abc", "separador de línea"],
        ["Clave#2026Abc ", "espacio final (no se recorta)"],
    ])("rechaza %j (%s)", (password) => {
        expect(passwordPolicyError(password)).toBe(PASSWORD_POLICY_MESSAGES.whitespace);
    });

    it.each([
        ["clave#2026abc", PASSWORD_POLICY_MESSAGES.missingUpper],
        ["CLAVE#2026ABC", PASSWORD_POLICY_MESSAGES.missingLower],
        ["Clave#Clave#Abc", PASSWORD_POLICY_MESSAGES.missingDigit],
        ["Clave2026Abcd", PASSWORD_POLICY_MESSAGES.missingSymbol],
    ])("rechaza %j por la clase que falta", (password, message) => {
        expect(passwordPolicyError(password)).toBe(message);
    });

    it("informa primero la longitud y luego los espacios, como el servidor", () => {
        expect(passwordPolicyError("a b")).toBe(PASSWORD_POLICY_MESSAGES.tooShort);
        expect(passwordPolicyError("clave 2026 abc")).toBe(PASSWORD_POLICY_MESSAGES.whitespace);
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

    it("si se indica, debe cumplir la política", () => {
        const short = editUserSchema.safeParse({ ...valid, password: "Ñandú#Clav1" });
        expect(short.success).toBe(false);
        if (!short.success) expect(fieldErrors(short.error).password).toBe(PASSWORD_POLICY_MESSAGES.tooShort);
        const nbsp = editUserSchema.safeParse({ ...valid, password: "Clave#2026\u00a0Abc" });
        expect(nbsp.success).toBe(false);
        if (!nbsp.success) expect(fieldErrors(nbsp.error).password).toBe(PASSWORD_POLICY_MESSAGES.whitespace);
        expect(editUserSchema.parse({ ...valid, password: "Clave#2026😀x" }).password).toBe("Clave#2026😀x");
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
