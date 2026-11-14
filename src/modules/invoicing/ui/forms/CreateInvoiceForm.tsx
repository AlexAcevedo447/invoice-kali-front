import { FormActions } from "@shared/ui/forms/FormActions";
import { FormField } from "@shared/ui/forms/FormField";
import { SubmitButton } from "@shared/ui/forms/SubmitButton";
import type { CreateInvoiceFormProps } from "@modules/invoicing/ui/forms/CreateInvoiceForm/createInvoiceForm.types";
import { useCreateInvoiceForm } from "@modules/invoicing/ui/forms/CreateInvoiceForm/useCreateInvoiceForm";
import { getErrorMessage } from "@modules/invoicing/ui/forms/CreateInvoiceForm/formErrors";
import { InvoiceItemTaxesEditor } from "@modules/invoicing/ui/forms/CreateInvoiceForm/InvoiceItemTaxesEditor";
import { Controller } from "react-hook-form";
import { CatalogSelect, type CatalogOption } from "@modules/invoicing/ui/components/CatalogSelect";
import { catalogApi } from "@modules/invoicing/infrastructure/catalog/catalogApi";
import type { Customer, Product } from "@modules/invoicing/domain/entities/Catalog";

// Búsquedas en los catálogos del tenant: el usuario ve nombres, documentos y
// códigos; el UUID solo se conserva como valor interno del formulario.
const searchCustomers = async (query: string): Promise<CatalogOption<Customer>[]> => {
    const { items } = await catalogApi.listCustomers(query);
    return items.map((c) => ({ id: c.id, label: `${c.name} — ${c.document}`, entity: c }));
};

const searchProducts = async (query: string): Promise<CatalogOption<Product>[]> => {
    const { items } = await catalogApi.listProducts(query);
    return items.map((p) => ({ id: p.id, label: `${p.code} — ${p.name}`, entity: p }));
};


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
        linesReadOnly,
    } = useCreateInvoiceForm(props);
    const { invoiceToEdit } = props;
    const customerOption: CatalogOption<Customer> | undefined = invoiceToEdit
        ? {
              id: invoiceToEdit.customerId,
              label: invoiceToEdit.customerName
                  ? `${invoiceToEdit.customerName} — ${invoiceToEdit.customerDocument}`
                  : "Cliente actual",
          }
        : undefined;

    return (
        <section className="surface-card p-4 border-round border-1 border-300">
            <h3 className="mt-0 mb-3">{isEditMode ? "Update Invoice" : "Create Invoice"}</h3>
            <form onSubmit={onSafeSubmit} noValidate>
                {/* Main fields */}
                <FormField
                    id="customerId"
                    label="Cliente"
                    required
                    error={getErrorMessage(form.formState.errors, ["customerId"])}
                >
                    <Controller
                        control={form.control}
                        name="customerId"
                        render={({ field, fieldState }) => (
                            <CatalogSelect<Customer>
                                inputId="customerId"
                                cy="customer-select"
                                value={field.value}
                                onChange={(id) => field.onChange(id)}
                                search={searchCustomers}
                                initialOption={customerOption}
                                placeholder="Buscar cliente por nombre o documento"
                                invalid={Boolean(fieldState.error)}
                            />
                        )}
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
                        onClick={appendItem}
                        disabled={linesReadOnly}
                        data-cy="invoice-item-add"
                    >
                        Add Item
                    </button>
                </div>

                {linesReadOnly ? (
                    <p
                        className="p-2 mt-0 mb-3 border-round surface-100 text-color-secondary"
                        data-cy="invoice-items-readonly-note"
                    >
                        Para modificar líneas o impuestos de una factura existente necesitas el permiso Líneas
                        de factura: gestionar (invoice-items/manage). Puedes cambiar el cliente y la fecha de
                        vencimiento.
                    </p>
                ) : null}

                {itemsArray.fields.map((field, index) => (
                    <section key={field.id} className="border-1 border-300 border-round p-3 mb-3">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <strong>Item {index + 1}</strong>
                            <button
                                type="button"
                                className="p-button p-component p-button-text p-button-danger"
                                onClick={() => removeItem(index)}
                                disabled={linesReadOnly || itemsArray.fields.length === 1}
                                data-cy={`invoice-item-${index}-remove`}
                            >
                                Remove
                            </button>
                        </div>

                        <div className="grid">
                            <div className="col-12">
                                <FormField
                                    id={`items.${index}.itemId`}
                                    label="Producto"
                                    required
                                    error={getErrorMessage(form.formState.errors, ["items", index, "itemId"])}
                                >
                                    <Controller
                                        control={form.control}
                                        name={`items.${index}.itemId`}
                                        render={({ field: productField, fieldState }) => {
                                            // En líneas guardadas el producto no cambia (el backend no
                                            // lo permite): se muestra su código y nombre.
                                            const savedLine = invoiceToEdit?.items.find(
                                                (line) => String(line.id) === field.lineId,
                                            );
                                            return (
                                                <CatalogSelect<Product>
                                                    inputId={`items.${index}.itemId`}
                                                    cy={`product-select-${index}`}
                                                    value={productField.value}
                                                    onChange={(id, product) => {
                                                        productField.onChange(id);
                                                        if (product && product.unitPrice > 0) {
                                                            form.setValue(`items.${index}.unitPrice`, product.unitPrice, {
                                                                shouldValidate: true,
                                                            });
                                                        }
                                                    }}
                                                    search={searchProducts}
                                                    initialOption={
                                                        savedLine
                                                            ? {
                                                                  id: savedLine.itemId,
                                                                  label: savedLine.productName
                                                                      ? `${savedLine.productCode} — ${savedLine.productName}`
                                                                      : "Producto actual",
                                                              }
                                                            : undefined
                                                    }
                                                    placeholder="Buscar producto por código o nombre"
                                                    disabled={isEditMode && Boolean(field.lineId)}
                                                    invalid={Boolean(fieldState.error)}
                                                />
                                            );
                                        }}
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
                                        disabled={linesReadOnly}
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
                                        disabled={linesReadOnly}
                                        {...form.register(`items.${index}.unitPrice`)}
                                    />
                                </FormField>
                            </div>
                        </div>

                        <InvoiceItemTaxesEditor form={form} itemIndex={index} readOnly={linesReadOnly} />
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
