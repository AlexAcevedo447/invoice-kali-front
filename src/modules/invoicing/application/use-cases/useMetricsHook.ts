import { useCallback } from "react";
import { useInvoicingDI } from "@modules/invoicing/useInvoicingDI";
import type {
  PublicRequest,
  InvoiceMetricsResult,
} from "@modules/invoicing/application/contracts";

export function useGetInvoicingMetrics() {
  const { useCases } = useInvoicingDI();
  return useCallback(
    (options?: PublicRequest): Promise<InvoiceMetricsResult> =>
      useCases.metrics.get(options),
    [useCases],
  );
}
