import { useEffect, useState } from "react";
import type { InvoicingDIContainer } from "./InvoicingDIProvider";
import { getInvoicingDIContainer } from "./invoicingDI.wiring";

export function useInvoicingDIContainer() {
  const [state, setState] = useState<{
    container: InvoicingDIContainer | null;
    loading: boolean;
    error: unknown;
  }>({
    container: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;
    getInvoicingDIContainer()
      .then((container) => {
        if (mounted) setState({ container, loading: false, error: null });
      })
      .catch((error) => {
        if (mounted) setState({ container: null, loading: false, error });
      });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
