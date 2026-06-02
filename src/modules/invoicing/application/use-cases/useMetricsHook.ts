import { useCallback } from "react";
import { useInvoicingDI } from "../../useInvoicingDI";
import type { PublicRequest, InvoiceMetricsResult } from "../contracts";

export function useGetInvoicingMetrics() {
  const { useCases } = useInvoicingDI();
  return useCallback(
    (options?: PublicRequest): Promise<InvoiceMetricsResult> =>
      useCases.metrics.get(options),
    [useCases],
  );
}
