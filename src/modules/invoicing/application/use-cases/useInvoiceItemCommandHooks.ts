import { useCallback } from "react";
import { useInvoicingDI } from "@modules/invoicing/useInvoicingDI";
import type {
  CreateInvoiceItemCommand,
  IdempotentRequest,
  InvoiceItemResult,
  UpdateInvoiceItemCommand,
  DeleteInvoiceItemCommand,
} from "@modules/invoicing/application/contracts";

export function useCreateInvoiceItemCommand() {
  const { useCases } = useInvoicingDI();
  return useCallback(
    (
      command: CreateInvoiceItemCommand,
      options: IdempotentRequest,
    ): Promise<InvoiceItemResult> =>
      useCases.invoiceItems.createCommand.create(command, options),
    [useCases],
  );
}

export function useUpdateInvoiceItemCommand() {
  const { useCases } = useInvoicingDI();
  return useCallback(
    (
      command: UpdateInvoiceItemCommand,
      options: IdempotentRequest,
    ): Promise<InvoiceItemResult> =>
      useCases.invoiceItems.updateCommand.update(command, options),
    [useCases],
  );
}

export function useDeleteInvoiceItemCommand() {
  const { useCases } = useInvoicingDI();
  return useCallback(
    (
      command: DeleteInvoiceItemCommand,
      options: IdempotentRequest,
    ): Promise<void> =>
      useCases.invoiceItems.deleteCommand.delete(command, options),
    [useCases],
  );
}
