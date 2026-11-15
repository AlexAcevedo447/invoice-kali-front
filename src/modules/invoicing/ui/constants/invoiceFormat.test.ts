import { describe, expect, it } from "vitest";
import { formatAmount, formatRatePercent } from "./invoiceFormat";

describe("formatAmount (formato visual es-CO con 2 decimales)", () => {
    it.each([
        [238, "$238,00"],
        [100, "$100,00"],
        [100.5, "$100,50"],
        [3684.43, "$3.684,43"],
        [0, "$0,00"],
        [0.41395, "$0,41"],
        [1862.9999999999998, "$1.863,00"],
        [1200000, "$1.200.000,00"],
        [1000, "$1.000,00"],
        [999.999, "$1.000,00"],
    ])("%s → %s", (value, expected) => {
        expect(formatAmount(value)).toBe(expected);
    });

    it("muestra siempre exactamente dos decimales", () => {
        [0.1, 1, 12.3456, 99.99 * 0.19, 1e-7, 123456.789].forEach((value) => {
            expect(formatAmount(value)).toMatch(/^-?\$\d{1,3}(\.\d{3})*,\d{2}$/);
        });
    });

    it("agrupa miles con punto y usa coma decimal", () => {
        expect(formatAmount(1234567.891)).toBe("$1.234.567,89");
        expect(formatAmount(1e21)).toBe("$1.000.000.000.000.000.000.000,00");
    });

    it("pone el signo antes del símbolo", () => {
        expect(formatAmount(-25)).toBe("-$25,00");
        expect(formatAmount(-3684.43)).toBe("-$3.684,43");
    });

    it("no muestra signo en importes que se ven como cero", () => {
        expect(formatAmount(-0)).toBe("$0,00");
        expect(formatAmount(-0.001)).toBe("$0,00");
    });

    it("solo formatea: no modifica el número recibido", () => {
        const amounts = [1862.9999999999998, 0.41395, 99.99 * 0.19];
        const copy = [...amounts];
        amounts.forEach((amount) => formatAmount(amount));
        expect(amounts).toEqual(copy);
        expect(amounts[0]).toBe(1862.9999999999998);
    });
});

describe("formatRatePercent (tarifa exacta con coma decimal)", () => {
    it.each([
        [0.19, "19 %"],
        [0.025, "2,5 %"],
        [0.0414, "4,14 %"],
        [0.00414, "0,414 %"],
        [0.29, "29 %"],
        [0, "0 %"],
        [1, "100 %"],
        [0.123456789, "12,3456789 %"],
    ])("%s → %s", (rate, expected) => {
        expect(formatRatePercent(rate)).toBe(expected);
    });
});
