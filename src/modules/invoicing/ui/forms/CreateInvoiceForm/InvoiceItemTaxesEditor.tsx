import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { FormField } from "@shared/ui/forms/FormField";
import type { CreateInvoiceFormValues } from "./createInvoiceForm.schema";
import { createEmptyTax } from "./createInvoiceForm.mappers";
import { getErrorMessage } from "./formErrors";

interface InvoiceItemTaxesEditorProps {
    form: UseFormReturn<CreateInvoiceFormValues>;
    itemIndex: number;
    /** Sin invoice-items/manage al editar una factura existente (D4-05). */
    readOnly?: boolean;
}

/**
 * Impuestos de una línea (0..N): código, tipo (débito/crédito, sin valor por
 * defecto) y tarifa en %. Los ids siguen la ruta de React Hook Form
 * (items.{i}.taxes.{j}.code|kind|rate).
 */
export const InvoiceItemTaxesEditor = ({ form, itemIndex, readOnly = false }: InvoiceItemTaxesEditorProps) => {
    const taxesArray = useFieldArray({
        control: form.control,
        name: `items.${itemIndex}.taxes`,
    });
    const errors = form.formState.errors;

    return (
        <div data-cy={`item-${itemIndex}-taxes`}>
            <div className="flex justify-content-between align-items-center mb-2">
                <h5 className="m-0">Impuestos</h5>
                <button
                    type="button"
                    className="p-button p-component p-button-text p-button-sm"
                    onClick={() => taxesArray.append(createEmptyTax())}
                    disabled={readOnly}
                    data-cy={`item-${itemIndex}-tax-add`}
                >
                    Agregar impuesto
                </button>
            </div>

            {taxesArray.fields.length === 0 ? (
                <p className="text-color-secondary m-0 mb-2" data-cy={`item-${itemIndex}-no-taxes`}>
                    Sin impuestos
                </p>
            ) : null}

            {taxesArray.fields.map((taxField, taxIndex) => {
                const base = `items.${itemIndex}.taxes.${taxIndex}` as const;
                const cy = `item-${itemIndex}-tax-${taxIndex}`;
                return (
                    <div key={taxField.id} className="grid align-items-start mb-1" data-cy={`${cy}-row`}>
                        <div className="col-12 md:col-4">
                            <FormField
                                id={`${base}.code`}
                                label="Code"
                                required
                                error={getErrorMessage(errors, ["items", itemIndex, "taxes", taxIndex, "code"])}
                            >
                                <input
                                    id={`${base}.code`}
                                    type="text"
                                    className="p-inputtext p-component w-full"
                                    disabled={readOnly}
                                    data-cy={`${cy}-code`}
                                    {...form.register(`${base}.code`)}
                                />
                            </FormField>
                        </div>
                        <div className="col-12 md:col-3">
                            <FormField
                                id={`${base}.kind`}
                                label="Kind"
                                required
                                error={getErrorMessage(errors, ["items", itemIndex, "taxes", taxIndex, "kind"])}
                            >
                                <select
                                    id={`${base}.kind`}
                                    className="p-inputtext p-component w-full"
                                    disabled={readOnly}
                                    data-cy={`${cy}-kind`}
                                    {...form.register(`${base}.kind`)}
                                >
                                    <option value="">Selecciona el tipo</option>
                                    <option value="DEBIT">Débito (DEBIT)</option>
                                    <option value="CREDIT">Crédito (CREDIT)</option>
                                </select>
                            </FormField>
                        </div>
                        <div className="col-12 md:col-3">
                            <FormField
                                id={`${base}.rate`}
                                label="Rate (%)"
                                required
                                error={getErrorMessage(errors, ["items", itemIndex, "taxes", taxIndex, "rate"])}
                            >
                                <input
                                    id={`${base}.rate`}
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="p. ej. 19 o 4.14"
                                    className="p-inputtext p-component w-full"
                                    disabled={readOnly}
                                    data-cy={`${cy}-rate`}
                                    {...form.register(`${base}.rate`)}
                                />
                            </FormField>
                        </div>
                        <div className="col-12 md:col-2 md:pt-5">
                            <button
                                type="button"
                                className="p-button p-component p-button-text p-button-danger p-button-sm"
                                onClick={() => taxesArray.remove(taxIndex)}
                                disabled={readOnly}
                                title="Quitar impuesto"
                                aria-label={`Quitar impuesto ${taxIndex + 1}`}
                                data-cy={`${cy}-remove`}
                            >
                                Quitar
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
