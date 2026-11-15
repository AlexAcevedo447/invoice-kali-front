import { describe, expect, it } from "vitest";
import { ES_CO_DECIMAL_MESSAGES } from "@shared/domain/esCoDecimal";
import { optionalEsCoDecimalToNumber, validateCatalogField, type CatalogFieldConfig } from "./catalogFields";

const unitPrice: CatalogFieldConfig = { name: "unitPrice", label: "Precio unitario", type: "decimal", min: 0 };
const code: CatalogFieldConfig = { name: "code", label: "Código", type: "text", requiredMessage: "El código es obligatorio" };

describe("validateCatalogField", () => {
    it("campo de texto obligatorio", () => {
        expect(validateCatalogField(code, "  ")).toBe("El código es obligatorio");
        expect(validateCatalogField(code, undefined)).toBe("El código es obligatorio");
        expect(validateCatalogField(code, "P-1")).toBeNull();
        // Un texto no se valida como número.
        expect(validateCatalogField(code, "1.5")).toBeNull();
    });

    it.each(["", "  ", undefined])("precio unitario opcional: %j es válido (se guarda 0)", (value) => {
        expect(validateCatalogField(unitPrice, value)).toBeNull();
    });

    it.each(["0", "100", "33,33", " 1234,5 ", "0,00001", "150000"])("acepta el precio %j", (value) => {
        expect(validateCatalogField(unitPrice, value)).toBeNull();
    });

    it.each([
        ["33.33", ES_CO_DECIMAL_MESSAGES.dot],
        ["150.000", ES_CO_DECIMAL_MESSAGES.dot],
        ["1.234,56", ES_CO_DECIMAL_MESSAGES.dot],
        ["1,2,3", ES_CO_DECIMAL_MESSAGES.manyCommas],
        ["$150", ES_CO_DECIMAL_MESSAGES.invalidChars],
        ["1 234", ES_CO_DECIMAL_MESSAGES.invalidChars],
        ["1e3", ES_CO_DECIMAL_MESSAGES.invalidChars],
    ])("rechaza el precio %j con un mensaje de formato", (value, message) => {
        expect(validateCatalogField(unitPrice, value)).toBe(message);
    });

    it("rechaza precios negativos con el mensaje de rango", () => {
        expect(validateCatalogField(unitPrice, "-1")).toBe("Precio unitario debe ser un número mayor o igual a 0");
        expect(validateCatalogField(unitPrice, "-0,01")).toBe("Precio unitario debe ser un número mayor o igual a 0");
    });
});

describe("optionalEsCoDecimalToNumber", () => {
    it.each([
        ["", 0],
        ["  ", 0],
        ["0", 0],
        ["33,33", 33.33],
        [" 1234,5 ", 1234.5],
        ["150000", 150000],
    ])("%j → %s exacto", (value, expected) => {
        expect(optionalEsCoDecimalToNumber(value)).toBe(expected);
    });

    it.each(["33.33", "150.000", "abc"])("rechaza %j (nunca lo lee como otro número)", (value) => {
        expect(() => optionalEsCoDecimalToNumber(value)).toThrow();
    });
});
