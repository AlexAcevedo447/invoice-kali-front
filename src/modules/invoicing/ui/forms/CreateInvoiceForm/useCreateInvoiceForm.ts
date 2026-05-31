import { useRef, useEffect } from "react";
import { useFieldArray } from "react-hook-form";
import { useInvoicingStore } from "../../../../../app/state/invoicingStore";
import type { InvoicingState } from "../../../../../app/state/invoicingStore";
import { useZodForm } from "../../../../../shared/ui/forms/useZodForm";
import type { CreateInvoiceFormProps } from "./createInvoiceForm.types";
import { createInvoiceSchema } from "./createInvoiceForm.schema";
import {
  getCreateInvoiceDefaultValues,
  mapInvoiceToCreateInvoiceFormValues,
  mapCreateInvoiceFormValuesToCreateCommand,
  mapCreateInvoiceFormValuesToUpdateCommand,
} from "./createInvoiceForm.mappers";

export function useCreateInvoiceForm({
  invoiceToEdit = null,
  onSuccess,
}: CreateInvoiceFormProps) {
  const isSubmittingRef = useRef(false);
  const isLoading = useInvoicingStore(
    (state: InvoicingState) => state.isLoading,
  );
  const error = useInvoicingStore((state: InvoicingState) => state.error);
  const createInvoice = useInvoicingStore(
    (state: InvoicingState) => state.actions.createInvoice,
  );
  const updateInvoice = useInvoicingStore(
    (state: InvoicingState) => state.actions.updateInvoice,
  );
  const clearError = useInvoicingStore(
    (state: InvoicingState) => state.actions.clearError,
  );
  const isEditMode = Boolean(invoiceToEdit);

  const form = useZodForm(createInvoiceSchema, {
    defaultValues: getCreateInvoiceDefaultValues(),
  });

  const itemsArray = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (!invoiceToEdit) {
      form.reset(getCreateInvoiceDefaultValues());
      return;
    }
    form.reset(mapInvoiceToCreateInvoiceFormValues(invoiceToEdit));
  }, [form, invoiceToEdit]);

  const onSubmit = form.handleSubmit(
    async (values: ReturnType<typeof getCreateInvoiceDefaultValues>) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      try {
        clearError();
        const result =
          isEditMode && invoiceToEdit
            ? await updateInvoice(
                mapCreateInvoiceFormValuesToUpdateCommand(
                  values,
                  invoiceToEdit.id,
                ),
              )
            : await createInvoice(
                mapCreateInvoiceFormValuesToCreateCommand(values),
              );
        if (result) onSuccess?.();
      } finally {
        isSubmittingRef.current = false;
      }
    },
  );

  const onSafeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit();
  };

  const appendItem = () =>
    itemsArray.append({
      itemId: "",
      quantity: 1,
      unitPrice: 0,
      taxes: [{ code: "IVA", kind: "DEBIT", rate: 18 }],
    });

  const removeItem = (index: number) => itemsArray.remove(index);

  return {
    form,
    itemsArray,
    isEditMode,
    isLoading,
    error,
    onSafeSubmit,
    appendItem,
    removeItem,
  };
}
