import { describe, expect, it } from "vitest";
import { isPercentString, percentToRate, rateToPercent, shiftDecimalPoint } from "./taxRate";

describe("rateToPercent (fracción del servidor → % exacto)", () => {
    it.each([
        [0.19, "19"],
        [0.18, "18"],
        [0.0414, "4.14"],
        [0.00414, "0.414"],
        [0.025, "2.5"],
        [0.07, "7"],
        [0.29, "29"],
        [0.57, "57"],
        [0.00001, "0.001"],
        [0.0000001, "0.00001"],
        [1, "100"],
        [0, "0"],
        [-0, "0"],
        [1.5, "150"],
        [12.345, "1234.5"],
        [123456789, "12345678900"],
        [1e21, "100000000000000000000000"],
        [0.123456789, "12.3456789"],
    ])("%s → %s", (rate, expected) => {
        expect(rateToPercent(rate)).toBe(expected);
    });

    it("no reproduce los artefactos de multiplicar por 100", () => {
        expect(0.29 * 100).not.toBe(29);
        expect(rateToPercent(0.29)).toBe("29");
        expect(0.07 * 100).not.toBe(7);
        expect(rateToPercent(0.07)).toBe("7");
    });

    it("rechaza valores no finitos", () => {
        expect(() => rateToPercent(Number.NaN)).toThrow();
        expect(() => rateToPercent(Number.POSITIVE_INFINITY)).toThrow();
    });
});

describe("percentToRate (% escrito → fracción para el servidor)", () => {
    it.each([
        ["19", 0.19],
        ["18", 0.18],
        ["4.14", 0.0414],
        ["0.414", 0.00414],
        ["2.5", 0.025],
        ["7", 0.07],
        ["29", 0.29],
        ["0.001", 0.00001],
        ["100", 1],
        ["0", 0],
        ["0.0", 0],
        ["007", 0.07],
        ["19.000", 0.19],
        ["  19  ", 0.19],
        ["150", 1.5],
        ["12345678900", 123456789],
    ])("%s → %s", (percent, expected) => {
        expect(percentToRate(percent)).toBe(expected);
    });

    it("no reproduce los artefactos de dividir entre 100", () => {
        expect(0.07 / 100).not.toBe(0.0007);
        expect(percentToRate("0.07")).toBe(0.0007);
        expect(1.1 / 100).not.toBe(0.011);
        expect(percentToRate("1.1")).toBe(0.011);
        expect(0.57 / 100).not.toBe(0.0057);
        expect(percentToRate("0.57")).toBe(0.0057);
    });

    it("conserva el signo para que la validación informe la tarifa negativa", () => {
        expect(percentToRate("-5")).toBe(-0.05);
    });

    it.each(["", "  ", "abc", "19,5", "1,000", "1e5", "19%", ".5", "5.", "--1", "+5", "1.2.3", "Infinity", "NaN"])(
        "rechaza %j",
        (percent) => {
            expect(isPercentString(percent)).toBe(false);
            expect(() => percentToRate(percent)).toThrow();
        },
    );
});

describe("ida y vuelta sin pérdida", () => {
    it.each([0, 0.19, 0.0414, 0.00414, 0.025, 0.07, 0.29, 0.00001, 1, 0.1, 0.2, 0.3, 0.123456789, 0.015, 0.33, 2.75, 1e-9, 99.99])(
        "fracción %s → % → fracción",
        (rate) => {
            expect(percentToRate(rateToPercent(rate))).toBe(rate);
        },
    );

    it.each(["19", "4.14", "0.414", "2.5", "7", "29", "0.001", "100", "0", "12.3456789"])("%s → fracción → %", (percent) => {
        expect(rateToPercent(percentToRate(percent))).toBe(percent);
    });
});

describe("shiftDecimalPoint", () => {
    it.each([
        ["19", -2, "0.19"],
        ["0.19", 2, "19"],
        ["1e-7", 2, "0.00001"],
        ["1.5e+21", 2, "150000000000000000000000"],
        ["-0.05", 2, "-5"],
        ["-0", 2, "0"],
        ["0.000", 2, "0"],
    ])("%s desplazado %s → %s", (value, places, expected) => {
        expect(shiftDecimalPoint(value, places)).toBe(expected);
    });

    it("rechaza texto no numérico", () => {
        expect(() => shiftDecimalPoint("abc", 2)).toThrow();
    });
});
