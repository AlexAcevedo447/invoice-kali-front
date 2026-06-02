import { useCallback } from "react";
import { useInvoicingDI } from "../../useInvoicingDI";
import type {
  ListInvoiceItemsQuery,
  PublicRequest,
  InvoiceItemListResult,
  InvoiceItemResult,
} from "../contracts";

export function useListInvoiceItems() {
  const { useCases } = useInvoicingDI();
  return useCallback(
    (
      query: ListInvoiceItemsQuery,
      options?: PublicRequest,
    ): Promise<InvoiceItemListResult> =>
      useCases.invoiceItems.listQuery.list(query, options),
    [useCases],
  );
}

export function useGetInvoiceItemById() {
  const { useCases } = useInvoicingDI();
  return useCallback(
    (id: string, options?: PublicRequest): Promise<InvoiceItemResult> =>
      useCases.invoiceItems.getByIdQuery.getById(id, options),
    [useCases],
  );
}