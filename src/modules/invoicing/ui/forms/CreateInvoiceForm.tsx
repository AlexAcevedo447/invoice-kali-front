import React, { type FormEvent } from "react";
import { useRef } from "react";
import { useEffect } from "react";
import { z } from "zod";
import { useFieldArray } from "react-hook-form";
import { useInvoicingStore } from "../../../../app/state/invoicingStore";
import type { InvoicingState } from "../../../../app/state/invoicingStore";
import { FormActions } from "../../../../shared/ui/forms/FormActions";
import { FormField } from "../../../../shared/ui/forms/FormField";
import { SubmitButton } from "../../../../shared/ui/forms/SubmitButton";
import { useZodForm } from "../../../../shared/ui/forms/useZodForm";
import type { Invoice } from "../../../../modules/invoicing/domain/entities/Invoice";

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

const toDateTimeLocalValue = (value?: Date | string | null): string => {
    if (!value) {
        return "";
    }

    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "";
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    const hours = String(parsed.getHours()).padStart(2, "0");
    const minutes = String(parsed.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

interface CreateInvoiceFormProps {
    invoiceToEdit?: Invoice | null;
    onSuccess?: () => void;
}

export const CreateInvoiceForm = ({
    invoiceToEdit = null,
    onSuccess,
}: CreateInvoiceFormProps) => {
    const isSubmittingRef = useRef(false);
    const isLoading = useInvoicingStore((state: InvoicingState) => state.isLoading);
    const invoicingError = useInvoicingStore((state: InvoicingState) => state.error);
    const createInvoice = useInvoicingStore((state: InvoicingState) => state.actions.createInvoice);
    const updateInvoice = useInvoicingStore((state: InvoicingState) => state.actions.updateInvoice);
    const clearError = useInvoicingStore((state: InvoicingState) => state.actions.clearError);
    const isEditMode = Boolean(invoiceToEdit);

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

    useEffect(() => {
        if (!invoiceToEdit) {
            form.reset({
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
            });
            return;
        }

        form.reset({
            customerId: invoiceToEdit.customerId,
            issueDate: toDateTimeLocalValue(invoiceToEdit.issueDate),
            dueDate: toDateTimeLocalValue(invoiceToEdit.dueDate),
            items:
                invoiceToEdit.items.length > 0
                    ? invoiceToEdit.items.map((item: Invoice["items"][number]) => ({
                        itemId: item.itemId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        taxes:
                            item.taxes.length > 0
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                ? item.taxes.map((tax: any) => ({
                                    code: tax.code,
                                    kind: tax.kind,
                                    rate: tax.rate,
                                }))
                                : [{ code: "IVA", kind: "DEBIT", rate: 18 }],
                    }))
                    : [
                        {
                            itemId: "",
                            quantity: 1,
                            unitPrice: 0,
                            taxes: [{ code: "IVA", kind: "DEBIT", rate: 18 }],
                        },
                    ],
        });
    }, [form, invoiceToEdit]);

    // eslint-disable-next-line react-hooks/refs
    const onSubmit = form.handleSubmit(async (values: CreateInvoiceFormValues) => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        try {
            clearError();

            const result = isEditMode && invoiceToEdit
                ? await updateInvoice({
                    id: invoiceToEdit.id,
                    customerId: values.customerId,
                    dueDate: toIsoOrUndefined(values.dueDate),
                })
                : await createInvoice({
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

            if (result) {
                onSuccess?.();
            }
        } finally {
            isSubmittingRef.current = false;
        }
    });

    const onSafeSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void onSubmit();
    };

    const inputStyle: React.CSSProperties = {
        outline: "none",
        boxShadow: "none",
        borderRadius: "8px",
        fontSize: "14px",
        padding: "0.75rem",
        border: "1px solid #D1D5DB",
        width: "100%",
        fontFamily: "Inter, -apple-system, sans-serif",
        color: "#111827",
        backgroundColor: "#ffffff",
        transition: "border-color 0.15s",
    };

    const labelStyle: React.CSSProperties = {
        fontSize: "0.8rem",
        fontWeight: 600,
        color: "#374151",
        marginBottom: "0.4rem",
        display: "block",
        letterSpacing: "0.01em",
    };

    const sectionHeaderStyle: React.CSSProperties = {
        fontSize: "0.75rem",
        fontWeight: 700,
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: "1rem",
        paddingBottom: "0.5rem",
        borderBottom: "1px solid #F3F4F6",
    };

    return (
        <form onSubmit={onSafeSubmit} noValidate style={{ fontFamily: "Inter, -apple-system, sans-serif" }}>

            {/* Sección: Información del cliente */}
            <div style={{ marginBottom: "1.5rem" }}>
                <p style={sectionHeaderStyle}>Información del cliente</p>
                <FormField
                    id="customerId"
                    label="ID del Cliente"
                    required
                    error={form.formState.errors.customerId?.message}
                >
                    <input
                        id="customerId"
                        type="text"
                        placeholder="ej. CLI-00123"
                        className="p-inputtext p-component w-full"
                        style={inputStyle}
                        {...form.register("customerId")}
                    />
                </FormField>
            </div>

            {/* Sección: Fechas */}
            <div style={{ marginBottom: "1.5rem" }}>
                <p style={sectionHeaderStyle}>Fechas</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <FormField
                        id="issueDate"
                        label="Fecha de Emisión"
                        error={form.formState.errors.issueDate?.message}
                    >
                        <input
                            id="issueDate"
                            type="datetime-local"
                            className="p-inputtext p-component w-full"
                            style={{ ...inputStyle, color: "#6B7280" }}
                            disabled={isEditMode}
                            {...form.register("issueDate")}
                        />
                    </FormField>
                    <FormField
                        id="dueDate"
                        label="Fecha de Vencimiento"
                        error={form.formState.errors.dueDate?.message}
                    >
                        <input
                            id="dueDate"
                            type="datetime-local"
                            className="p-inputtext p-component w-full"
                            style={{ ...inputStyle, color: "#6B7280" }}
                            {...form.register("dueDate")}
                        />
                    </FormField>
                </div>
            </div>

            {/* Sección: Ítems */}
            <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "1px solid #F3F4F6" }}>
                    <p style={{ ...sectionHeaderStyle, margin: 0, border: "none", padding: 0 }}>Líneas de la Factura</p>
                    {!isEditMode && (
                        <button
                            type="button"
                            onClick={() => itemsArray.append({ itemId: "", quantity: 1, unitPrice: 0, taxes: [{ code: "IVA", kind: "DEBIT", rate: 18 }] })}
                            style={{ backgroundColor: "#F5F3FF", color: "#3B82F6", border: "1px solid #DDD6FE", borderRadius: "6px", padding: "0.35rem 0.75rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
                        >
                            <i className="pi pi-plus" style={{ fontSize: "0.7rem" }}></i>
                            Agregar ítem
                        </button>
                    )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {itemsArray.fields.map((field, index) => (
                        <div key={field.id} style={{ border: "1px solid #E5E7EB", borderRadius: "10px", padding: "1rem", backgroundColor: "#FAFAFA" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Ítem {index + 1}
                                </span>
                                {!isEditMode && itemsArray.fields.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => itemsArray.remove(index)}
                                        style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}
                                    >
                                        <i className="pi pi-trash" style={{ fontSize: "0.75rem" }}></i>
                                        Eliminar
                                    </button>
                                )}
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                <div>
                                    <label style={labelStyle}>ID del Producto</label>
                                    <input
                                        id={`items.${index}.itemId`}
                                        type="text"
                                        placeholder="ej. PROD-001"
                                        className="p-inputtext p-component"
                                        style={inputStyle}
                                        disabled={isEditMode}
                                        {...form.register(`items.${index}.itemId`)}
                                    />
                                    {form.formState.errors.items?.[index]?.itemId && (
                                        <small style={{ color: "#EF4444", fontSize: "0.75rem" }}>{form.formState.errors.items?.[index]?.itemId?.message}</small>
                                    )}
                                </div>
                                <div>
                                    <label style={labelStyle}>Cantidad</label>
                                    <input
                                        id={`items.${index}.quantity`}
                                        type="number"
                                        min={1}
                                        className="p-inputtext p-component"
                                        style={inputStyle}
                                        disabled={isEditMode}
                                        {...form.register(`items.${index}.quantity`)}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Precio Unitario</label>
                                    <input
                                        id={`items.${index}.unitPrice`}
                                        type="number"
                                        min={0.01}
                                        step={0.01}
                                        placeholder="0.00"
                                        className="p-inputtext p-component"
                                        style={inputStyle}
                                        disabled={isEditMode}
                                        {...form.register(`items.${index}.unitPrice`)}
                                    />
                                </div>
                            </div>

                            {/* Tax subsection */}
                            <div style={{ backgroundColor: "#F9FAFB", borderRadius: "6px", padding: "0.75rem", border: "1px solid #F3F4F6" }}>
                                <p style={{ ...sectionHeaderStyle, marginBottom: "0.6rem", paddingBottom: "0", border: "none", fontSize: "0.7rem" }}>Impuesto</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                                    <div>
                                        <label style={labelStyle}>Código</label>
                                        <input
                                            id={`items.${index}.taxes.0.code`}
                                            type="text"
                                            className="p-inputtext p-component"
                                            style={{ ...inputStyle, backgroundColor: "#F9FAFB" }}
                                            disabled={isEditMode}
                                            {...form.register(`items.${index}.taxes.0.code`)}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Tipo</label>
                                        <select
                                            id={`items.${index}.taxes.0.kind`}
                                            className="p-inputtext p-component"
                                            style={{ ...inputStyle, backgroundColor: "#F9FAFB", appearance: "none" }}
                                            disabled={isEditMode}
                                            {...form.register(`items.${index}.taxes.0.kind`)}
                                        >
                                            <option value="DEBIT">Débito</option>
                                            <option value="CREDIT">Crédito</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Tasa (%)</label>
                                        <input
                                            id={`items.${index}.taxes.0.rate`}
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            className="p-inputtext p-component"
                                            style={{ ...inputStyle, backgroundColor: "#F9FAFB" }}
                                            disabled={isEditMode}
                                            {...form.register(`items.${index}.taxes.0.rate`)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Error global */}
            {invoicingError && (
                <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <i className="pi pi-exclamation-triangle" style={{ color: "#DC2626", fontSize: "0.9rem" }}></i>
                    <p role="alert" style={{ margin: 0, color: "#DC2626", fontSize: "0.85rem", fontWeight: 500 }}>{invoicingError}</p>
                </div>
            )}

            {/* Botón de acción */}
            <SubmitButton
                label={isEditMode ? "Guardar Cambios" : "Crear Factura"}
                loadingLabel={isEditMode ? "Guardando..." : "Creando factura..."}
                isSubmitting={isLoading}
                className="w-full text-white font-semibold cursor-pointer"
                style={{ backgroundColor: "#3B82F6", border: "none", borderRadius: "8px", fontSize: "15px", padding: "0.875rem", width: "100%", transition: "background-color 0.2s" }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563EB")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3B82F6")}
            />
        </form>
    );
};

