import type { FormEvent } from "react";
import { useRef } from "react";
import { z } from "zod";
import { useFieldArray } from "react-hook-form";
import { useInvoicingStore } from "@app/state";
import { FormActions, FormField, SubmitButton, useZodForm } from "@shared/ui";

const taxSchema = z.object({
    code: z.string().min(1, "Code is required"),
    kind: z.enum(["DEBIT", "CREDIT"]).default("DEBIT"),
    rate: z.coerce.number().min(0, "Rate must be >= 0"),
});

const itemSchema = z.object({
    itemId: z.string().min(1, "Item ID is required"),
    quantity: z.coerce.number().gt(0, "Quantity must be > 0"),
    unitPrice: z.coerce.number().gt(0, "Unit price must be > 0"),
    taxes: z.array(taxSchema).min(1, "At least one tax is required"),
});

const createInvoiceSchema = z.object({
    customerId: z.string().min(1, "Customer ID is required"),
    issueDate: z.string().optional(),
    dueDate: z.string().optional(),
    items: z.array(itemSchema).min(1, "At least one item is required"),
});

type CreateInvoiceFormValues = z.infer<typeof createInvoiceSchema>;

const toIsoOrUndefined = (value?: string): string | undefined => {
    if (!value) {
        return undefined;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return undefined;
    }

    return parsed.toISOString();
};

export const CreateInvoiceForm = () => {
    const isSubmittingRef = useRef(false);
    const isLoading = useInvoicingStore((state) => state.isLoading);
    const invoicingError = useInvoicingStore((state) => state.error);
    const createInvoice = useInvoicingStore((state) => state.actions.createInvoice);
    const clearError = useInvoicingStore((state) => state.actions.clearError);

    const form = useZodForm<CreateInvoiceFormValues>(createInvoiceSchema, {
        defaultValues: {
            customerId: "",
            issueDate: "",
            dueDate: "",
            items: [
                {
                    itemId: "",
                    quantity: 1,
                    unitPrice: 0,
                    taxes: [{ code: "IVA", kind: "DEBIT", rate: 18 }],
                },
            ],
        },
    });

    const itemsArray = useFieldArray({
        control: form.control,
        name: "items",
    });

    const onSubmit = form.handleSubmit(async (values: CreateInvoiceFormValues) => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        try {
            clearError();

            await createInvoice({
                customerId: values.customerId,
                issueDate: toIsoOrUndefined(values.issueDate),
                dueDate: toIsoOrUndefined(values.dueDate),
                items: values.items.map((item) => ({
                    itemId: item.itemId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    taxes: item.taxes,
                })),
            });
        } finally {
            isSubmittingRef.current = false;
        }
    });

    const onSafeSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void onSubmit();
    };

    return (
        <section className="surface-card p-4 border-round border-1 border-300">
            <h3 className="mt-0 mb-3">Create Invoice</h3>
            <form onSubmit={onSafeSubmit} noValidate>
                <FormField
                    id="customerId"
                    label="Customer ID"
                    required
                    error={form.formState.errors.customerId?.message}
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
                            error={form.formState.errors.issueDate?.message}
                        >
                            <input
                                id="issueDate"
                                type="datetime-local"
                                className="p-inputtext p-component w-full"
                                {...form.register("issueDate")}
                            />
                        </FormField>
                    </div>
                    <div className="col-12 md:col-6">
                        <FormField
                            id="dueDate"
                            label="Due Date"
                            hint="Optional, format RFC3339"
                            error={form.formState.errors.dueDate?.message}
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

                <div className="flex justify-content-between align-items-center mb-3">
                    <h4 className="m-0">Items</h4>
                    <button
                        type="button"
                        className="p-button p-component p-button-text"
                        onClick={() =>
                            itemsArray.append({
                                itemId: "",
                                quantity: 1,
                                unitPrice: 0,
                                taxes: [{ code: "IVA", kind: "DEBIT", rate: 18 }],
                            })
                        }
                    >
                        Add Item
                    </button>
                </div>

                {itemsArray.fields.map((field, index) => {
                    return (
                        <section key={field.id} className="border-1 border-300 border-round p-3 mb-3">
                            <div className="flex justify-content-between align-items-center mb-2">
                                <strong>Item {index + 1}</strong>
                                <button
                                    type="button"
                                    className="p-button p-component p-button-text p-button-danger"
                                    onClick={() => itemsArray.remove(index)}
                                    disabled={itemsArray.fields.length === 1}
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
                                        error={form.formState.errors.items?.[index]?.itemId?.message}
                                    >
                                        <input
                                            id={`items.${index}.itemId`}
                                            type="text"
                                            className="p-inputtext p-component w-full"
                                            {...form.register(`items.${index}.itemId`)}
                                        />
                                    </FormField>
                                </div>
                                <div className="col-12 md:col-4">
                                    <FormField
                                        id={`items.${index}.quantity`}
                                        label="Quantity"
                                        required
                                        error={form.formState.errors.items?.[index]?.quantity?.message}
                                    >
                                        <input
                                            id={`items.${index}.quantity`}
                                            type="number"
                                            min={1}
                                            className="p-inputtext p-component w-full"
                                            {...form.register(`items.${index}.quantity`)}
                                        />
                                    </FormField>
                                </div>
                                <div className="col-12 md:col-4">
                                    <FormField
                                        id={`items.${index}.unitPrice`}
                                        label="Unit Price"
                                        required
                                        error={form.formState.errors.items?.[index]?.unitPrice?.message}
                                    >
                                        <input
                                            id={`items.${index}.unitPrice`}
                                            type="number"
                                            min={0.01}
                                            step={0.01}
                                            className="p-inputtext p-component w-full"
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
                                        error={
                                            form.formState.errors.items?.[index]?.taxes?.[0]?.code
                                                ?.message
                                        }
                                    >
                                        <input
                                            id={`items.${index}.taxes.0.code`}
                                            type="text"
                                            className="p-inputtext p-component w-full"
                                            {...form.register(`items.${index}.taxes.0.code`)}
                                        />
                                    </FormField>
                                </div>

                                <div className="col-12 md:col-4">
                                    <FormField
                                        id={`items.${index}.taxes.0.kind`}
                                        label="Kind"
                                        required
                                        error={
                                            form.formState.errors.items?.[index]?.taxes?.[0]?.kind
                                                ?.message
                                        }
                                    >
                                        <select
                                            id={`items.${index}.taxes.0.kind`}
                                            className="p-inputtext p-component w-full"
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
                                        error={
                                            form.formState.errors.items?.[index]?.taxes?.[0]?.rate
                                                ?.message
                                        }
                                    >
                                        <input
                                            id={`items.${index}.taxes.0.rate`}
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            className="p-inputtext p-component w-full"
                                            {...form.register(`items.${index}.taxes.0.rate`)}
                                        />
                                    </FormField>
                                </div>
                            </div>
                        </section>
                    );
                })}

                {invoicingError ? (
                    <p role="alert" className="text-red-500 m-0 mb-2">
                        {invoicingError}
                    </p>
                ) : null}

                <FormActions>
                    <SubmitButton
                        label="Create Invoice"
                        loadingLabel="Creating..."
                        isSubmitting={isLoading}
                    />
                </FormActions>
            </form>
        </section>
    );
};
