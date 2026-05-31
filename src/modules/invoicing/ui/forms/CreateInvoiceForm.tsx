// Helper para acceder seguro a errores anidados de React Hook Form
import type { FieldErrors } from "react-hook-form";
import type { CreateInvoiceFormValues } from "@modules/invoicing/ui/forms/CreateInvoiceForm/createInvoiceForm.schema";

function getErrorMessage(
    errors: FieldErrors<CreateInvoiceFormValues>,
    path: (string | number)[]
): string | undefined {
    let current: unknown = errors;
    for (const key of path) {
        if (typeof current !== "object" || current == null) return undefined;
        current = (current as Record<string, unknown>)[key];
    }
    if (
        typeof current === "object" &&
        current !== null &&
        "message" in current &&
        typeof (current as { message?: unknown }).message === "string"
    ) {
        return (current as { message: string }).message;
    }
    return undefined;
}

import { FormActions } from "@shared/ui/forms/FormActions";
import { FormField } from "@shared/ui/forms/FormField";
import { SubmitButton } from "@shared/ui/forms/SubmitButton";
import type { CreateInvoiceFormProps } from "@modules/invoicing/ui/forms/CreateInvoiceForm/createInvoiceForm.types";
import { useCreateInvoiceForm } from "@modules/invoicing/ui/forms/CreateInvoiceForm/useCreateInvoiceForm";


export const CreateInvoiceForm = (props: CreateInvoiceFormProps) => {
    const {
        form,
        itemsArray,
        isEditMode,
        isLoading,
        error,
        onSafeSubmit,
        appendItem,
        removeItem,
    } = useCreateInvoiceForm(props);

    return (
        <section className="surface-card p-4 border-round border-1 border-300">
            <h3 className="mt-0 mb-3">{isEditMode ? "Update Invoice" : "Create Invoice"}</h3>
            <form onSubmit={onSafeSubmit} noValidate>
                {/* Main fields */}
                <FormField
                    id="customerId"
                    label="Customer ID"
                    required
                    error={getErrorMessage(form.formState.errors, ["customerId"])}
                >
                    <input
                        id="customerId"
                        type="text"
                        className="p-inputtext p-component w-full"
                        {...form.register("customerId")}
                    />
                </FormField>

                <div className="grid">
                    <div className="col-12 md:col-6">
                        <FormField
                            id="issueDate"
                            label="Issue Date"
                            hint="Optional, format RFC3339"
                            error={getErrorMessage(form.formState.errors, ["issueDate"])}
                        >
                            <input
                                id="issueDate"
                                type="datetime-local"
                                className="p-inputtext p-component w-full"
                                disabled={isEditMode}
                                {...form.register("issueDate")}
                            />
                        </FormField>
                    </div>
                    <div className="col-12 md:col-6">
                        <FormField
                            id="dueDate"
                            label="Due Date"
                            hint="Optional, format RFC3339"
                            error={getErrorMessage(form.formState.errors, ["dueDate"])}
                        >
                            <input
                                id="dueDate"
                                type="datetime-local"
                                className="p-inputtext p-component w-full"
                                {...form.register("dueDate")}
                            />
                        </FormField>
                    </div>
                </div>

                {/* Items section */}
                <div className="flex justify-content-between align-items-center mb-3">
                    <h4 className="m-0">Items</h4>
                    <button
                        type="button"
                        className="p-button p-component p-button-text"
                        disabled={isEditMode}
                        onClick={appendItem}
                    >
                        Add Item
                    </button>
                </div>

                {itemsArray.fields.map((field, index) => (
                    <section key={field.id} className="border-1 border-300 border-round p-3 mb-3">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <strong>Item {index + 1}</strong>
                            <button
                                type="button"
                                className="p-button p-component p-button-text p-button-danger"
                                onClick={() => removeItem(index)}
                                disabled={isEditMode || itemsArray.fields.length === 1}
                            >
                                Remove
                            </button>
                        </div>

                        <div className="grid">
                            <div className="col-12 md:col-4">
                                <FormField
                                    id={`items.${index}.itemId`}
                                    label="Item ID"
                                    required
                                    error={getErrorMessage(form.formState.errors, ["items", index, "itemId"])}
                                >
                                    <input
                                        id={`items.${index}.itemId`}
                                        type="text"
                                        className="p-inputtext p-component w-full"
                                        disabled={isEditMode}
                                        {...form.register(`items.${index}.itemId`)}
                                    />
                                </FormField>
                            </div>
                            <div className="col-12 md:col-4">
                                <FormField
                                    id={`items.${index}.quantity`}
                                    label="Quantity"
                                    required
                                    error={getErrorMessage(form.formState.errors, ["items", index, "quantity"])}
                                >
                                    <input
                                        id={`items.${index}.quantity`}
                                        type="number"
                                        min={1}
                                        className="p-inputtext p-component w-full"
                                        disabled={isEditMode}
                                        {...form.register(`items.${index}.quantity`)}
                                    />
                                </FormField>
                            </div>
                            <div className="col-12 md:col-4">
                                <FormField
                                    id={`items.${index}.unitPrice`}
                                    label="Unit Price"
                                    required
                                    error={getErrorMessage(form.formState.errors, ["items", index, "unitPrice"])}
                                >
                                    <input
                                        id={`items.${index}.unitPrice`}
                                        type="number"
                                        min={0.01}
                                        step={0.01}
                                        className="p-inputtext p-component w-full"
                                        disabled={isEditMode}
                                        {...form.register(`items.${index}.unitPrice`)}
                                    />
                                </FormField>
                            </div>
                        </div>

                        <h5 className="mb-2">Primary Tax</h5>
                        <div className="grid align-items-end mb-2">
                            <div className="col-12 md:col-4">
                                <FormField
                                    id={`items.${index}.taxes.0.code`}
                                    label="Code"
                                    required
                                    error={getErrorMessage(form.formState.errors, ["items", index, "taxes", 0, "code"])}
                                >
                                    <input
                                        id={`items.${index}.taxes.0.code`}
                                        type="text"
                                        className="p-inputtext p-component w-full"
                                        disabled={isEditMode}
                                        {...form.register(`items.${index}.taxes.0.code`)}
                                    />
                                </FormField>
                            </div>
                            <div className="col-12 md:col-4">
                                <FormField
                                    id={`items.${index}.taxes.0.kind`}
                                    label="Kind"
                                    required
                                    error={getErrorMessage(form.formState.errors, ["items", index, "taxes", 0, "kind"])}
                                >
                                    <select
                                        id={`items.${index}.taxes.0.kind`}
                                        className="p-inputtext p-component w-full"
                                        disabled={isEditMode}
                                        {...form.register(`items.${index}.taxes.0.kind`)}
                                    >
                                        <option value="DEBIT">DEBIT</option>
                                        <option value="CREDIT">CREDIT</option>
                                    </select>
                                </FormField>
                            </div>
                            <div className="col-12 md:col-4">
                                <FormField
                                    id={`items.${index}.taxes.0.rate`}
                                    label="Rate"
                                    required
                                    error={getErrorMessage(form.formState.errors, ["items", index, "taxes", 0, "rate"])}
                                >
                                    <input
                                        id={`items.${index}.taxes.0.rate`}
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        className="p-inputtext p-component w-full"
                                        disabled={isEditMode}
                                        {...form.register(`items.${index}.taxes.0.rate`)}
                                    />
                                </FormField>
                            </div>
                        </div>
                    </section>
                ))}

                {error ? (
                    <p role="alert" className="text-red-500 m-0 mb-2">{error}</p>
                ) : null}

                <FormActions>
                    <SubmitButton
                        label={isEditMode ? "Update Invoice" : "Create Invoice"}
                        loadingLabel={isEditMode ? "Updating..." : "Creating..."}
                        isSubmitting={isLoading}
                    />
                </FormActions>
            </form>
        </section>
    );
};
