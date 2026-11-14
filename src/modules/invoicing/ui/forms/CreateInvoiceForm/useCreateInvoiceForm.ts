import { useRef, useEffect, useState } from "react";
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
  percentToRate,
} from "./createInvoiceForm.mappers";
import type { CreateInvoiceFormValues } from "./createInvoiceForm.schema";

type FormItem = CreateInvoiceFormValues["items"][number];

const toItemTaxes = (item: FormItem) =>
  item.taxes.map((tax) => ({
    code: tax.code,
    kind: tax.kind,
    rate: percentToRate(tax.rate),
  }));

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
  const createInvoiceItem = useInvoicingStore(
    (state: InvoicingState) => state.actions.createInvoiceItem,
  );
  const updateInvoiceItem = useInvoicingStore(
    (state: InvoicingState) => state.actions.updateInvoiceItem,
  );
  const deleteInvoiceItem = useInvoicingStore(
    (state: InvoicingState) => state.actions.deleteInvoiceItem,
  );
  // Líneas ya borradas en este modal: un reintento tras un fallo parcial no las repite.
  const deletedLinesRef = useRef<Set<string>>(new Set());
  const isEditMode = Boolean(invoiceToEdit);
  const [persistError, setPersistError] = useState<string | null>(null);

  const form = useZodForm(createInvoiceSchema, {
    defaultValues: getCreateInvoiceDefaultValues(),
  });

  const itemsArray = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    deletedLinesRef.current = new Set();
    if (!invoiceToEdit) {
      form.reset(getCreateInvoiceDefaultValues());
      return;
    }
    form.reset(mapInvoiceToCreateInvoiceFormValues(invoiceToEdit));
  }, [form, invoiceToEdit]);

  const submitValues = async (
    values: ReturnType<typeof getCreateInvoiceDefaultValues>,
  ) => {
    clearError();
    setPersistError(null);
    if (isEditMode && invoiceToEdit) {
      const command = mapCreateInvoiceFormValuesToUpdateCommand(
        values,
        invoiceToEdit.id,
      );
      const result = await updateInvoice(command);
      if (!result) return;
      // Confirmar que el backend realmente guardó lo enviado antes de cerrar.
      const sameCustomer = result.customerId === command.customerId;
      const sameDueDate =
        !command.dueDate ||
        (result.dueDate !== null &&
          result.dueDate.getTime() === new Date(command.dueDate).getTime());
      if (!sameCustomer || !sameDueDate) {
        setPersistError("La factura no se actualizó. Intenta nuevamente.");
        return;
      }

      // Líneas: se aplican las diferencias con los endpoints de invoice-items.
      const original = new Map(
        invoiceToEdit.items.map((item) => [String(item.id), item]),
      );
      const keptLineIds = new Set(
        values.items.map((item) => item.lineId).filter(Boolean),
      );
      for (const [index, item] of values.items.entries()) {
        const taxes = toItemTaxes(item);
        if (!item.lineId) {
          const created = await createInvoiceItem({
            invoiceId: invoiceToEdit.id,
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxes,
          });
          if (!created) return;
          // Marca la línea como guardada para no duplicarla si se reintenta.
          form.setValue(`items.${index}.lineId`, String(created.id));
          continue;
        }
        const before = original.get(item.lineId);
        if (!before) continue;
        // El formulario solo muestra el impuesto principal de cada línea:
        // se compara ese impuesto y se conservan los adicionales al guardar.
        const [formTax] = taxes;
        const beforeTax = before.taxes[0] ?? { code: "IVA", kind: "DEBIT", rate: 0 };
        const changed =
          before.quantity !== item.quantity ||
          before.unitPrice !== item.unitPrice ||
          beforeTax.code !== formTax.code ||
          beforeTax.kind !== formTax.kind ||
          beforeTax.rate !== formTax.rate;
        if (changed) {
          const keepNoTaxes = before.taxes.length === 0 && formTax.rate === 0;
          const updated = await updateInvoiceItem({
            id: item.lineId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxes: keepNoTaxes
              ? []
              : [
                  formTax,
                  ...before.taxes
                    .slice(1)
                    .map((t) => ({ code: t.code, kind: t.kind, rate: t.rate })),
                ],
          });
          if (!updated) return;
        }
      }
      for (const lineId of original.keys()) {
        if (keptLineIds.has(lineId) || deletedLinesRef.current.has(lineId)) continue;
        const deleted = await deleteInvoiceItem(lineId);
        if (!deleted) return;
        deletedLinesRef.current.add(lineId);
      }

      onSuccess?.();
      return;
    }
    const result = await createInvoice(
      mapCreateInvoiceFormValuesToCreateCommand(values),
    );
    if (result) onSuccess?.();
  };

  // La guarda contra envíos duplicados vive en el manejador del evento (no en
  // render): cubre validación + peticiones y se libera siempre al terminar.
  const onSafeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    void form
      .handleSubmit(submitValues)()
      .finally(() => {
        isSubmittingRef.current = false;
      });
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
    error: error ?? persistError,
    onSafeSubmit,
    appendItem,
    removeItem,
  };
}
