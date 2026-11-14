import { describe, expect, it } from "vitest";
import type { Invoice } from "@modules/invoicing/domain/entities/Invoice";
import type { InvoiceItem } from "@modules/invoicing/domain/entities/InvoiceItem";
import type { InvoiceTax } from "@modules/invoicing/domain/entities/InvoiceTax";
import {
    buildInvoiceItemUpdate,
    createEmptyItem,
    createEmptyTax,
    getCreateInvoiceDefaultValues,
    mapCreateInvoiceFormValuesToCreateCommand,
    mapFormTaxesToCommand,
    mapInvoiceToCreateInvoiceFormValues,
    sameTaxes,
} from "./createInvoiceForm.mappers";
import type { InvoiceFormItem } from "./createInvoiceForm.schema";

const tax = (code: string, kind: "DEBIT" | "CREDIT", rate: number, amount = 0): InvoiceTax =>
    ({ id: `t-${code}`, invoiceId: "inv-1", invoiceItemId: "line-1", code, kind, rate, amount }) as InvoiceTax;

const line = (overrides: Partial<InvoiceItem> = {}): InvoiceItem =>
    ({
        id: "line-1",
        invoiceId: "inv-1",
        itemId: "prod-1",
        productCode: "P1",
        productName: "Producto 1",
        quantity: 2,
        unitPrice: 100,
        taxes: [],
        taxTotal: 0,
        subtotal: 200,
        total: 200,
        ...overrides,
    }) as InvoiceItem;

const invoiceWith = (items: InvoiceItem[]): Invoice =>
    ({
        id: "inv-1",
        customerId: "cust-1",
        customerName: "Cliente",
        customerDocument: "123",
        issueDate: null,
        dueDate: null,
        items,
        subtotal: 0,
        taxTotal: 0,
        total: 0,
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
    }) as Invoice;

const formItemFrom = (item: InvoiceItem): InvoiceFormItem =>
    mapInvoiceToCreateInvoiceFormValues(invoiceWith([item])).items[0];

describe("valores iniciales", () => {
    it("una línea nueva empieza sin impuestos", () => {
        expect(createEmptyItem().taxes).toEqual([]);
        expect(getCreateInvoiceDefaultValues().items).toEqual([createEmptyItem()]);
    });

    it("un impuesto nuevo no tiene tipo por defecto", () => {
        expect(createEmptyTax()).toEqual({ code: "", kind: "", rate: "" });
    });
});

describe("mapInvoiceToCreateInvoiceFormValues (CA-13.2, CA-13.8)", () => {
    it("muestra todos los impuestos en el orden guardado con la tarifa exacta en %", () => {
        const values = mapInvoiceToCreateInvoiceFormValues(
            invoiceWith([
                line({
                    taxes: [tax("IVA", "DEBIT", 0.19), tax("RETEFUENTE", "CREDIT", 0.025), tax("ICA", "CREDIT", 0.00414)],
                }),
            ]),
        );
        expect(values.items[0].taxes).toEqual([
            { code: "IVA", kind: "DEBIT", rate: "19" },
            { code: "RETEFUENTE", kind: "CREDIT", rate: "2.5" },
            { code: "ICA", kind: "CREDIT", rate: "0.414" },
        ]);
    });

    it("una línea guardada sin impuestos sigue sin impuestos (no se inventa IVA 0 %)", () => {
        expect(mapInvoiceToCreateInvoiceFormValues(invoiceWith([line()])).items[0].taxes).toEqual([]);
    });

    it("conserva tarifas que darían artefactos al multiplicar por 100", () => {
        const values = mapInvoiceToCreateInvoiceFormValues(invoiceWith([line({ taxes: [tax("A", "DEBIT", 0.29), tax("B", "DEBIT", 0.07)] })]));
        expect(values.items[0].taxes.map((t) => t.rate)).toEqual(["29", "7"]);
    });
});

describe("mapFormTaxesToCommand", () => {
    it("convierte % → fracción exacta y recorta el código", () => {
        expect(
            mapFormTaxesToCommand([
                { code: " IVA ", kind: "DEBIT", rate: "19" },
                { code: "ReteICA", kind: "CREDIT", rate: "0.414" },
            ]),
        ).toEqual([
            { code: "IVA", kind: "DEBIT", rate: 0.19 },
            { code: "ReteICA", kind: "CREDIT", rate: 0.00414 },
        ]);
    });

    it("rechaza un impuesto sin tipo (la validación lo impide antes)", () => {
        expect(() => mapFormTaxesToCommand([{ code: "IVA", kind: "", rate: "19" }])).toThrow();
    });
});

describe("mapCreateInvoiceFormValuesToCreateCommand (CA-13.1)", () => {
    it("envía todos los impuestos de cada línea, también ninguno", () => {
        const command = mapCreateInvoiceFormValuesToCreateCommand({
            customerId: "cust-1",
            issueDate: "",
            dueDate: "",
            items: [
                {
                    itemId: "p-1",
                    quantity: 2,
                    unitPrice: 100,
                    taxes: [
                        { code: "IVA", kind: "DEBIT", rate: "19" },
                        { code: "RETEFUENTE", kind: "CREDIT", rate: "2.5" },
                    ],
                },
                { itemId: "p-2", quantity: 1, unitPrice: 50, taxes: [] },
            ],
        });
        expect(command.items.map((item) => item.taxes)).toEqual([
            [
                { code: "IVA", kind: "DEBIT", rate: 0.19 },
                { code: "RETEFUENTE", kind: "CREDIT", rate: 0.025 },
            ],
            [],
        ]);
    });
});

describe("sameTaxes", () => {
    it("compara código normalizado, tipo y tarifa exacta en orden", () => {
        expect(sameTaxes([{ code: " iva", kind: "DEBIT", rate: 0.19 }], [{ code: "IVA ", kind: "DEBIT", rate: 0.19 }])).toBe(true);
        expect(sameTaxes([{ code: "IVA", kind: "DEBIT", rate: 0.19 }], [{ code: "IVA", kind: "CREDIT", rate: 0.19 }])).toBe(false);
        expect(sameTaxes([{ code: "IVA", kind: "DEBIT", rate: 0.19 }], [{ code: "IVA", kind: "DEBIT", rate: 0.1900001 }])).toBe(false);
        expect(
            sameTaxes(
                [
                    { code: "A", kind: "DEBIT", rate: 0.1 },
                    { code: "B", kind: "DEBIT", rate: 0.2 },
                ],
                [
                    { code: "B", kind: "DEBIT", rate: 0.2 },
                    { code: "A", kind: "DEBIT", rate: 0.1 },
                ],
            ),
        ).toBe(false);
        expect(sameTaxes([], [])).toBe(true);
    });
});

describe("buildInvoiceItemUpdate (CA-13.3: PUT solo si algo cambió, con la lista completa)", () => {
    const saved = line({
        taxes: [tax("IVA", "DEBIT", 0.19), tax("RETEFUENTE", "CREDIT", 0.025), tax("ICA", "CREDIT", 0.00414)],
    });

    it("sin cambios no hay PUT (la ida y vuelta % ↔ fracción es exacta)", () => {
        expect(buildInvoiceItemUpdate(saved, formItemFrom(saved))).toBeNull();
    });

    it("sin cambios en una línea sin impuestos no hay PUT", () => {
        const empty = line();
        expect(buildInvoiceItemUpdate(empty, formItemFrom(empty))).toBeNull();
    });

    it.each([0.29, 0.07, 0.00001, 0.123456789, 1, 0])("tarifa %s guardada: abrir y guardar sin cambios no envía PUT", (rate) => {
        const item = line({ taxes: [tax("X", "DEBIT", rate)] });
        expect(buildInvoiceItemUpdate(item, formItemFrom(item))).toBeNull();
    });

    it("cambiar solo mayúsculas o espacios del código no es un cambio", () => {
        const form = formItemFrom(saved);
        form.taxes[0] = { ...form.taxes[0], code: " iva " };
        expect(buildInvoiceItemUpdate(saved, form)).toBeNull();
    });

    it("cambiar la cantidad envía la lista completa de impuestos", () => {
        const form = { ...formItemFrom(saved), quantity: 3 };
        expect(buildInvoiceItemUpdate(saved, form)).toEqual({
            id: "line-1",
            quantity: 3,
            unitPrice: 100,
            taxes: [
                { code: "IVA", kind: "DEBIT", rate: 0.19 },
                { code: "RETEFUENTE", kind: "CREDIT", rate: 0.025 },
                { code: "ICA", kind: "CREDIT", rate: 0.00414 },
            ],
        });
    });

    it("cambiar el precio unitario es un cambio", () => {
        expect(buildInvoiceItemUpdate(saved, { ...formItemFrom(saved), unitPrice: 101 })).not.toBeNull();
    });

    it("editar el tercer impuesto conserva los demás tal cual", () => {
        const form = formItemFrom(saved);
        form.taxes[2] = { ...form.taxes[2], rate: "1" };
        expect(buildInvoiceItemUpdate(saved, form)?.taxes).toEqual([
            { code: "IVA", kind: "DEBIT", rate: 0.19 },
            { code: "RETEFUENTE", kind: "CREDIT", rate: 0.025 },
            { code: "ICA", kind: "CREDIT", rate: 0.01 },
        ]);
    });

    it("cambiar el tipo es un cambio", () => {
        const form = formItemFrom(saved);
        form.taxes[0] = { ...form.taxes[0], kind: "CREDIT" };
        expect(buildInvoiceItemUpdate(saved, form)?.taxes[0]).toEqual({ code: "IVA", kind: "CREDIT", rate: 0.19 });
    });

    it("quitar un impuesto se persiste (PUT sin ese impuesto)", () => {
        const form = formItemFrom(saved);
        form.taxes = [form.taxes[0], form.taxes[2]];
        expect(buildInvoiceItemUpdate(saved, form)?.taxes).toEqual([
            { code: "IVA", kind: "DEBIT", rate: 0.19 },
            { code: "ICA", kind: "CREDIT", rate: 0.00414 },
        ]);
    });

    it("quitar todos los impuestos envía una lista vacía", () => {
        const form = { ...formItemFrom(saved), taxes: [] };
        expect(buildInvoiceItemUpdate(saved, form)?.taxes).toEqual([]);
    });

    it("agregar un impuesto a una línea sin impuestos se persiste", () => {
        const empty = line();
        const form = { ...formItemFrom(empty), taxes: [{ code: "IVA", kind: "DEBIT" as const, rate: "19" }] };
        expect(buildInvoiceItemUpdate(empty, form)?.taxes).toEqual([{ code: "IVA", kind: "DEBIT", rate: 0.19 }]);
    });

    it("reordenar impuestos es un cambio (se conserva el orden)", () => {
        const form = formItemFrom(saved);
        form.taxes = [form.taxes[1], form.taxes[0], form.taxes[2]];
        expect(buildInvoiceItemUpdate(saved, form)).not.toBeNull();
    });
});
