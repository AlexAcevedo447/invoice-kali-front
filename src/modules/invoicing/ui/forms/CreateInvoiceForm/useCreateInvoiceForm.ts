import { useRef, useEffect, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { useInvoicingStore } from "../../../../../app/state/invoicingStore";
import type { InvoicingState } from "../../../../../app/state/invoicingStore";
import { useAuthSessionStore, type AuthSessionState } from "../../../../../app/state/authSessionStore";
import { canManageInvoiceItems } from "../../../../../app/routing/access";
import { useZodForm } from "../../../../../shared/ui/forms/useZodForm";
import type { CreateInvoiceFormProps } from "./createInvoiceForm.types";
import { createInvoiceSchema } from "./createInvoiceForm.schema";
import {
  buildInvoiceItemUpdate,
  createEmptyItem,
  getCreateInvoiceDefaultValues,
  mapFormTaxesToCommand,
  mapInvoiceToCreateInvoiceFormValues,
  mapCreateInvoiceFormValuesToCreateCommand,
  mapCreateInvoiceFormValuesToUpdateCommand,
} from "./createInvoiceForm.mappers";
import type { CreateInvoiceFormValues } from "./createInvoiceForm.schema";

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
  const permissions = useAuthSessionStore((s: AuthSessionState) => s.permissions);
  // D4-05: las líneas de una factura existente se guardan con /invoice-items,
  // que exige invoice-items/manage. Sin ese permiso solo se edita la cabecera
  // (invoices/manage). Crear una factura con sus líneas solo exige invoices/manage.
  const linesReadOnly = isEditMode && !canManageInvoiceItems(permissions);
  const [persistError, setPersistError] = useState<string | null>(null);

  const form = useZodForm<CreateInvoiceFormValues>(createInvoiceSchema, {
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

  const submitValues = async (values: CreateInvoiceFormValues) => {
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

      // Sin invoice-items/manage las líneas son de solo lectura: no se tocan.
      if (linesReadOnly) {
        onSuccess?.();
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
        if (!item.lineId) {
          const created = await createInvoiceItem({
            invoiceId: invoiceToEdit.id,
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxes: mapFormTaxesToCommand(item.taxes),
          });
          if (!created) return;
          // Marca la línea como guardada para no duplicarla si se reintenta.
          form.setValue(`items.${index}.lineId`, String(created.id));
          continue;
        }
        const before = original.get(item.lineId);
        if (!before) continue;
        // Solo se envía PUT si cambió la cantidad, el precio o la lista de
        // impuestos; el PUT reemplaza la lista completa de impuestos.
        const update = buildInvoiceItemUpdate(before, item);
        if (update) {
          const updated = await updateInvoiceItem(update);
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

  const appendItem = () => {
    if (linesReadOnly) return;
    itemsArray.append(createEmptyItem());
  };

  const removeItem = (index: number) => {
    if (linesReadOnly) return;
    itemsArray.remove(index);
  };

  return {
    form,
    itemsArray,
    isEditMode,
    isLoading,
    error: error ?? persistError,
    onSafeSubmit,
    appendItem,
    removeItem,
    linesReadOnly,
  };
}
