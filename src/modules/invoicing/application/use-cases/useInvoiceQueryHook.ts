import { useCallback } from "react";
import { useInvoicingDI } from "@modules/invoicing/useInvoicingDI";
import type { Invoice } from "@modules/invoicing/domain/entities/Invoice";

export function useListInvoicesQuery() {
  const { useCases } = useInvoicingDI();
  return useCallback(
    (): Promise<Invoice[]> => useCases.queries.list(),
    [useCases],
  );
}
