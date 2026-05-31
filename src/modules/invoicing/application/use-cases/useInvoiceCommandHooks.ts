import { useCallback } from "react";
import { useInvoicingDI } from "@modules/invoicing/useInvoicingDI";
import type {
  CreateInvoiceCommand,
  IdempotentRequest,
  InvoiceResult,
  UpdateInvoiceCommand,
  InvoiceStatusCommand,
} from "@modules/invoicing/application/contracts";

export function useCreateInvoiceCommand() {
  const { useCases } = useInvoicingDI();
  return useCallback(
    (
      command: CreateInvoiceCommand,
      options: IdempotentRequest,
    ): Promise<InvoiceResult> =>
      useCases.invoices.createCommand.create(command, options),
    [useCases],
  );
}

export function useUpdateInvoiceCommand() {
  const { useCases } = useInvoicingDI();
  return useCallback(
    (
      command: UpdateInvoiceCommand,
      options: IdempotentRequest,
    ): Promise<InvoiceResult> =>
      useCases.invoices.updateCommand.update(command, options),
    [useCases],
  );
}

export function usePayInvoiceCommand() {
  const { useCases } = useInvoicingDI();
  return useCallback(
    (
      command: InvoiceStatusCommand,
      options: IdempotentRequest,
    ): Promise<InvoiceResult> =>
      useCases.invoices.payCommand.pay(command, options),
    [useCases],
  );
}

export function useCancelInvoiceCommand() {
  const { useCases } = useInvoicingDI();
  return useCallback(
    (
      command: InvoiceStatusCommand,
      options: IdempotentRequest,
    ): Promise<InvoiceResult> =>
      useCases.invoices.cancelCommand.cancel(command, options),
    [useCases],
  );
}
