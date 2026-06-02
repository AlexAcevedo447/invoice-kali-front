import { useCallback } from "react";
import { useInvoicingDI } from "../../useInvoicingDI";
import type { Invoice } from "../../domain/entities/Invoice";

export function useListInvoicesQuery() {
  const { useCases } = useInvoicingDI();
  return useCallback(
    (): Promise<Invoice[]> => useCases.queries.list(),
    [useCases],
  );
}
