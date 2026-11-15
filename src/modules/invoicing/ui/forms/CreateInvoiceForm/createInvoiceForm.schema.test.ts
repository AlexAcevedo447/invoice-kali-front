import { describe, expect, it } from "vitest";
import { ES_CO_DECIMAL_MESSAGES } from "@shared/domain/esCoDecimal";
import {
    createInvoiceSchema,
    ITEM_MESSAGES,
    itemSchema,
    TAX_MESSAGES,
    taxCodeKey,
    taxSchema,
    taxesSchema,
} from "./createInvoiceForm.schema";

const issues = (result: { success: boolean; error?: { issues: Array<{ path: PropertyKey[]; message: string }> } }) =>
    (result.error?.issues ?? []).map((issue) => ({ path: issue.path.join("."), message: issue.message }));

const validTax = { code: "IVA", kind: "DEBIT", rate: "19" };

const invoice = (taxes: unknown[]) => ({
    customerId: "c-1",
    issueDate: "",
    dueDate: "",
    items: [{ itemId: "p-1", quantity: "1", unitPrice: "100", taxes }],
});

describe("taxSchema", () => {
    it("acepta un impuesto válido y recorta código y tarifa", () => {
        expect(taxSchema.parse({ code: "  iva ", kind: "CREDIT", rate: " 4,14 " })).toEqual({
            code: "iva",
            kind: "CREDIT",
            rate: "4,14",
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

    it.each([
        ["19.5", ES_CO_DECIMAL_MESSAGES.dot],
        ["2.5", ES_CO_DECIMAL_MESSAGES.dot],
        ["0.414", ES_CO_DECIMAL_MESSAGES.dot],
        ["1.234,5", ES_CO_DECIMAL_MESSAGES.dot],
        ["1,2,3", ES_CO_DECIMAL_MESSAGES.manyCommas],
        ["abc", ES_CO_DECIMAL_MESSAGES.invalidChars],
        ["1e2", ES_CO_DECIMAL_MESSAGES.invalidChars],
        ["19%", ES_CO_DECIMAL_MESSAGES.invalidChars],
        ["1 9", ES_CO_DECIMAL_MESSAGES.invalidChars],
        [",5", ES_CO_DECIMAL_MESSAGES.invalidChars],
    ])("rechaza la tarifa %j (coma decimal es-CO, sin puntos)", (rate, message) => {
        expect(issues(taxSchema.safeParse({ ...validTax, rate }))).toEqual([{ path: "rate", message }]);
    });

    it.each(["-1", "-0,5"])("rechaza la tarifa negativa %j", (rate) => {
        expect(issues(taxSchema.safeParse({ ...validTax, rate }))).toEqual([
            { path: "rate", message: TAX_MESSAGES.rateNegative },
        ]);
    });

    it.each(["0", "0,0", "19,5", "4,14", "2,5", "100", "250", "0,00001", " 2,5 "])("acepta la tarifa %s (≥ 0, sin máximo)", (rate) => {
        expect(taxSchema.safeParse({ ...validTax, rate }).success).toBe(true);
    });
});

describe("taxesSchema", () => {
    it("admite una línea sin impuestos (D4-01)", () => {
        expect(taxesSchema.parse([])).toEqual([]);
    });

    it("admite varios impuestos con códigos distintos", () => {
        expect(
            taxesSchema.safeParse([validTax, { code: "RETEFUENTE", kind: "CREDIT", rate: "2,5" }]).success,
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
                { path: "items.0.taxes.1.rate", message: ES_CO_DECIMAL_MESSAGES.invalidChars },
                { path: "items.0.taxes.1.code", message: TAX_MESSAGES.codeRepeated("IVA") },
            ]),
        );
    });
});

describe("itemSchema: cantidad y precio unitario con coma decimal es-CO", () => {
    const item = (quantity: string, unitPrice: string) => ({ itemId: "p-1", quantity, unitPrice, taxes: [] });

    it.each([
        ["1", "100"],
        ["2,5", "33,33"],
        [" 3 ", " 1234,5 "],
        ["0,001", "0,01"],
        ["123456789,123", "150000"],
    ])("acepta cantidad %j y precio %j", (quantity, unitPrice) => {
        expect(itemSchema.safeParse(item(quantity, unitPrice)).success).toBe(true);
    });

    it("conserva el texto (recortado); la conversión exacta la hacen los mappers", () => {
        expect(itemSchema.parse(item(" 2,5 ", "33,33"))).toMatchObject({ quantity: "2,5", unitPrice: "33,33" });
    });

    it.each([
        ["1.5", ES_CO_DECIMAL_MESSAGES.dot],
        ["1.234", ES_CO_DECIMAL_MESSAGES.dot],
        ["1,2,3", ES_CO_DECIMAL_MESSAGES.manyCommas],
        ["1 234", ES_CO_DECIMAL_MESSAGES.invalidChars],
        ["$150", ES_CO_DECIMAL_MESSAGES.invalidChars],
        ["1e3", ES_CO_DECIMAL_MESSAGES.invalidChars],
        ["5,", ES_CO_DECIMAL_MESSAGES.invalidChars],
    ])("cantidad %j: error de formato antes que el de rango", (quantity, message) => {
        expect(issues(itemSchema.safeParse(item(quantity, "100")))).toEqual([{ path: "quantity", message }]);
    });

    it.each([
        ["33.33", ES_CO_DECIMAL_MESSAGES.dot],
        ["150.000", ES_CO_DECIMAL_MESSAGES.dot],
        ["1.234,56", ES_CO_DECIMAL_MESSAGES.dot],
        ["1,234,5", ES_CO_DECIMAL_MESSAGES.manyCommas],
        ["$150", ES_CO_DECIMAL_MESSAGES.invalidChars],
        ["150\u00a0000", ES_CO_DECIMAL_MESSAGES.invalidChars],
    ])("precio %j: error de formato", (unitPrice, message) => {
        expect(issues(itemSchema.safeParse(item("1", unitPrice)))).toEqual([{ path: "unitPrice", message }]);
    });

    it.each(["0", "0,0", "-1", "-0,5"])("cantidad %j fuera de rango → mensaje existente", (quantity) => {
        expect(issues(itemSchema.safeParse(item(quantity, "100")))).toEqual([
            { path: "quantity", message: ITEM_MESSAGES.quantityRange },
        ]);
        expect(ITEM_MESSAGES.quantityRange).toBe("Quantity must be > 0");
    });

    it.each(["0", "0,00", "-25"])("precio %j fuera de rango → mensaje existente", (unitPrice) => {
        expect(issues(itemSchema.safeParse(item("1", unitPrice)))).toEqual([
            { path: "unitPrice", message: ITEM_MESSAGES.unitPriceRange },
        ]);
        expect(ITEM_MESSAGES.unitPriceRange).toBe("Unit price must be > 0");
    });

    it("cantidad y precio vacíos son obligatorios", () => {
        expect(issues(itemSchema.safeParse(item("  ", "")))).toEqual([
            { path: "quantity", message: ITEM_MESSAGES.quantityRequired },
            { path: "unitPrice", message: ITEM_MESSAGES.unitPriceRequired },
        ]);
    });
});

describe("taxCodeKey", () => {
    it("normaliza como el servidor (trim + mayúsculas)", () => {
        expect(taxCodeKey("  ReteIVA ")).toBe("RETEIVA");
    });
});
