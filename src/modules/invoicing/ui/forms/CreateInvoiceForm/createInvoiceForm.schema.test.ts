import { describe, expect, it } from "vitest";
import { createInvoiceSchema, TAX_MESSAGES, taxCodeKey, taxSchema, taxesSchema } from "./createInvoiceForm.schema";

const issues = (result: { success: boolean; error?: { issues: Array<{ path: PropertyKey[]; message: string }> } }) =>
    (result.error?.issues ?? []).map((issue) => ({ path: issue.path.join("."), message: issue.message }));

const validTax = { code: "IVA", kind: "DEBIT", rate: "19" };

const invoice = (taxes: unknown[]) => ({
    customerId: "c-1",
    issueDate: "",
    dueDate: "",
    items: [{ itemId: "p-1", quantity: 1, unitPrice: 100, taxes }],
});

describe("taxSchema", () => {
    it("acepta un impuesto válido y recorta código y tarifa", () => {
        expect(taxSchema.parse({ code: "  iva ", kind: "CREDIT", rate: " 4.14 " })).toEqual({
            code: "iva",
            kind: "CREDIT",
            rate: "4.14",
        });
    });

    it("exige el código sin contar espacios", () => {
        expect(issues(taxSchema.safeParse({ ...validTax, code: "   " }))).toEqual([
            { path: "code", message: TAX_MESSAGES.codeRequired },
        ]);
    });

    it("exige elegir el tipo (no hay valor por defecto)", () => {
        expect(issues(taxSchema.safeParse({ ...validTax, kind: "" }))).toEqual([
            { path: "kind", message: TAX_MESSAGES.kindRequired },
        ]);
        expect(issues(taxSchema.safeParse({ ...validTax, kind: "OTHER" }))).toEqual([
            { path: "kind", message: TAX_MESSAGES.kindRequired },
        ]);
        expect(issues(taxSchema.safeParse({ code: "IVA", rate: "19" }))).toEqual([
            { path: "kind", message: TAX_MESSAGES.kindRequired },
        ]);
    });

    it("exige la tarifa", () => {
        expect(issues(taxSchema.safeParse({ ...validTax, rate: "  " }))).toEqual([
            { path: "rate", message: TAX_MESSAGES.rateRequired },
        ]);
    });

    it.each(["19,5", "abc", "1e2", "19%"])("rechaza la tarifa %j (solo punto decimal)", (rate) => {
        expect(issues(taxSchema.safeParse({ ...validTax, rate }))).toEqual([
            { path: "rate", message: TAX_MESSAGES.rateInvalid },
        ]);
    });

    it("rechaza tarifas negativas", () => {
        expect(issues(taxSchema.safeParse({ ...validTax, rate: "-1" }))).toEqual([
            { path: "rate", message: TAX_MESSAGES.rateNegative },
        ]);
    });

    it.each(["0", "0.0", "4.14", "100", "250", "0.00001"])("acepta la tarifa %s (≥ 0, sin máximo)", (rate) => {
        expect(taxSchema.safeParse({ ...validTax, rate }).success).toBe(true);
    });
});

describe("taxesSchema", () => {
    it("admite una línea sin impuestos (D4-01)", () => {
        expect(taxesSchema.parse([])).toEqual([]);
    });

    it("admite varios impuestos con códigos distintos", () => {
        expect(
            taxesSchema.safeParse([validTax, { code: "RETEFUENTE", kind: "CREDIT", rate: "2.5" }]).success,
        ).toBe(true);
    });

    it("marca el código repetido (sin mayúsculas ni espacios exteriores) en la fila repetida", () => {
        const result = taxesSchema.safeParse([
            validTax,
            { code: "INC", kind: "DEBIT", rate: "8" },
            { code: "  iva ", kind: "CREDIT", rate: "1" },
        ]);
        expect(issues(result)).toEqual([{ path: "2.code", message: TAX_MESSAGES.codeRepeated("IVA") }]);
        expect(TAX_MESSAGES.codeRepeated("IVA")).toContain('"IVA"');
    });

    it("marca cada repetición, no la primera aparición", () => {
        const result = taxesSchema.safeParse([validTax, validTax, validTax]);
        expect(issues(result).map((issue) => issue.path)).toEqual(["1.code", "2.code"]);
    });

    it("detecta repetidos aunque otra fila tenga errores", () => {
        const result = taxesSchema.safeParse([validTax, { code: "iva", kind: "", rate: "" }]);
        expect(issues(result)).toEqual(
            expect.arrayContaining([
                { path: "1.code", message: TAX_MESSAGES.codeRepeated("IVA") },
                { path: "1.kind", message: TAX_MESSAGES.kindRequired },
                { path: "1.rate", message: TAX_MESSAGES.rateRequired },
            ]),
        );
    });

    it("no considera repetidos los códigos vacíos (ya se informa que son obligatorios)", () => {
        const result = taxesSchema.safeParse([
            { ...validTax, code: "" },
            { ...validTax, code: " " },
        ]);
        expect(issues(result)).toEqual([
            { path: "0.code", message: TAX_MESSAGES.codeRequired },
            { path: "1.code", message: TAX_MESSAGES.codeRequired },
        ]);
    });
});

describe("createInvoiceSchema", () => {
    it("acepta líneas sin impuestos", () => {
        expect(createInvoiceSchema.safeParse(invoice([])).success).toBe(true);
    });

    it("ubica los errores de impuestos en items.{i}.taxes.{j}.campo", () => {
        const result = createInvoiceSchema.safeParse(invoice([validTax, { code: "IVA", kind: "", rate: "x" }]));
        expect(issues(result)).toEqual(
            expect.arrayContaining([
                { path: "items.0.taxes.1.kind", message: TAX_MESSAGES.kindRequired },
                { path: "items.0.taxes.1.rate", message: TAX_MESSAGES.rateInvalid },
                { path: "items.0.taxes.1.code", message: TAX_MESSAGES.codeRepeated("IVA") },
            ]),
        );
    });
});

describe("taxCodeKey", () => {
    it("normaliza como el servidor (trim + mayúsculas)", () => {
        expect(taxCodeKey("  ReteIVA ")).toBe("RETEIVA");
    });
});
