import { describe, expect, it } from "vitest";
import { ES_CO_DECIMAL_MESSAGES, formatEsCoDecimal, parseEsCoDecimal } from "./esCoDecimal";

describe("parseEsCoDecimal (coma decimal, sin separadores de miles)", () => {
    it.each([
        ["1,5", 1.5, "1.5"],
        ["1,234", 1.234, "1.234"],
        [" 2,5 ", 2.5, "2.5"],
        ["2,5 ", 2.5, "2.5"],
        [" 2,5\t", 2.5, "2.5"],
        ["-1", -1, "-1"],
        ["0", 0, "0"],
        ["0,00001", 0.00001, "0.00001"],
        ["123456789,123", 123456789.123, "123456789.123"],
        ["19", 19, "19"],
        ["007", 7, "007"],
    ])("acepta %j → %s", (text, value, canonical) => {
        expect(parseEsCoDecimal(text)).toEqual({ ok: true, value, canonical });
    });

    it("el valor es exactamente Number(canónico): sin redondeo", () => {
        const result = parseEsCoDecimal("0,1");
        expect(result.ok && result.value).toBe(0.1);
        const long = parseEsCoDecimal("33,333333333333336");
        expect(long.ok && long.value).toBe(Number("33.333333333333336"));
    });

    it.each(["1.5", "1.234", "1.234,56", "150.000", "1,234.5", ".5", "5."])(
        "rechaza %j por usar punto (nunca lo lee como miles ni como decimal)",
        (text) => {
            expect(parseEsCoDecimal(text)).toEqual({ ok: false, error: ES_CO_DECIMAL_MESSAGES.dot });
        },
    );

    it.each(["1,2,3", "1,234,567", ",,5"])("rechaza %j por tener más de una coma", (text) => {
        expect(parseEsCoDecimal(text)).toEqual({ ok: false, error: ES_CO_DECIMAL_MESSAGES.manyCommas });
    });

    it.each([
        "1 234",
        "1 234",
        "1 234",
        "1'234",
        "$150",
        "19%",
        "1e3",
        "1E3",
        ",5",
        "5,",
        "abc",
        "+5",
        "--1",
        "- 1",
        "Infinity",
        "NaN",
        "٣",
        "１２",
    ])("rechaza %j con caracteres no permitidos", (text) => {
        expect(parseEsCoDecimal(text)).toEqual({ ok: false, error: ES_CO_DECIMAL_MESSAGES.invalidChars });
    });

    it.each(["", "   ", " "])("texto vacío %j: error vacío (cada campo pone su mensaje de obligatorio)", (text) => {
        expect(parseEsCoDecimal(text)).toEqual({ ok: false, error: ES_CO_DECIMAL_MESSAGES.empty });
    });

    it("los mensajes de formato son claros y en español", () => {
        expect(ES_CO_DECIMAL_MESSAGES.dot).toBe(
            "Usa coma (,) para los decimales y no uses puntos de miles. Ejemplo: 1234,5",
        );
        expect(ES_CO_DECIMAL_MESSAGES.manyCommas).toBe("Usa una sola coma decimal. No uses separadores de miles.");
        expect(ES_CO_DECIMAL_MESSAGES.invalidChars).toBe("Escribe solo números y, si hace falta, una coma decimal.");
    });
});

describe("formatEsCoDecimal (texto exacto para precargar un campo)", () => {
    it.each([
        [1.5, "1,5"],
        [1234.5, "1234,5"],
        [150000, "150000"],
        [0, "0"],
        [-0, "0"],
        [-2.75, "-2,75"],
        [33.33, "33,33"],
        [0.0000001, "0,0000001"],
        [1e21, "1000000000000000000000"],
        [0.1 + 0.2, "0,30000000000000004"],
    ])("%s → %j (sin agrupar ni redondear)", (value, expected) => {
        expect(formatEsCoDecimal(value)).toBe(expected);
    });

    it.each([0, 1.5, 33.33, 0.00414, 123456789.123, 0.1 + 0.2, 1e-7, 99.99])("ida y vuelta exacta: %s", (value) => {
        const parsed = parseEsCoDecimal(formatEsCoDecimal(value));
        expect(parsed.ok && parsed.value).toBe(value);
    });

    it("rechaza valores no finitos", () => {
        expect(() => formatEsCoDecimal(Number.NaN)).toThrow();
        expect(() => formatEsCoDecimal(Number.POSITIVE_INFINITY)).toThrow();
    });
});
