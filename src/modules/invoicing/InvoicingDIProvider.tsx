import { useMemo, type PropsWithChildren } from "react";
import { InvoicingDIContext } from "@modules/invoicing/InvoicingDIContext";
import type { InvoicingDIContainer } from "@modules/invoicing/ports/InvoicingDIContainer";


export const InvoicingDIProvider = ({ children, container }: PropsWithChildren<{ container: InvoicingDIContainer }>) => {
    const value = useMemo(() => container, [container]);
    return <InvoicingDIContext.Provider value={value}>{children}</InvoicingDIContext.Provider>;
};
