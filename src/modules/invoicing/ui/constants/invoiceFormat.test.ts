import { describe, expect, it } from "vitest";
import { formatAmount } from "./invoiceFormat";

describe("formatAmount (D4-04: sin redondeo en el cliente)", () => {
    it.each([
        [238, "$238.00"],
        [100.5, "$100.50"],
        [3684.43, "$3684.43"],
        [0, "$0.00"],
        [1200000, "$1200000.00"],
    ])("completa hasta 2 decimales sin cambiar el valor: %s → %s", (value, expected) => {
        expect(formatAmount(value)).toBe(expected);
    });

    it("no recorta ni redondea importes con más de 2 decimales", () => {
        expect(formatAmount(0.413958)).toBe("$0.413958");
        expect(formatAmount(1863.005)).toBe("$1863.005");
        expect(formatAmount(0.004)).toBe("$0.004");
    });

    it("muestra exactamente el número que envía el servidor (también artefactos de float64)", () => {
        const amount = 99.99 * 0.19; // calculado igual que el servidor (sin redondeo)
        expect(formatAmount(amount)).toBe(`$${String(amount)}`);
        expect(Number(formatAmount(amount).slice(1))).toBe(amount);
    });

    it("conserva el signo y los valores sin exponente", () => {
        expect(formatAmount(-25)).toBe("-$25.00");
        expect(formatAmount(1e-7)).toBe("$0.0000001");
        expect(formatAmount(1e21)).toBe("$1000000000000000000000.00");
    });
});
