import type { Invoice } from "@modules/invoicing/domain/entities/Invoice";
import type { CreateInvoiceFormValues } from "@modules/invoicing/ui/forms/CreateInvoiceForm/createInvoiceForm.schema";

export const toIsoOrUndefined = (value?: string): string | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

export const toDateTimeLocalValue = (value?: Date | string | null): string => {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const getCreateInvoiceDefaultValues = (): CreateInvoiceFormValues => ({
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

export const mapInvoiceToCreateInvoiceFormValues = (
  invoice: Invoice,
): CreateInvoiceFormValues => ({
  customerId: invoice.customerId,
  issueDate: toDateTimeLocalValue(invoice.issueDate),
  dueDate: toDateTimeLocalValue(invoice.dueDate),
  items:
    invoice.items.length > 0
      ? invoice.items.map((item: Invoice["items"][number]) => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxes:
            item.taxes.length > 0
              ? item.taxes.map((tax: (typeof item)["taxes"][number]) => ({
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

export const mapCreateInvoiceFormValuesToCreateCommand = (
  values: CreateInvoiceFormValues,
) => ({
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

export const mapCreateInvoiceFormValuesToUpdateCommand = (
  values: CreateInvoiceFormValues,
  invoiceId: string,
) => ({
  id: invoiceId,
  customerId: values.customerId,
  dueDate: toIsoOrUndefined(values.dueDate),
});
