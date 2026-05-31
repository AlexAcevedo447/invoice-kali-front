import { createContext } from "react";
import type { InvoicingDIContainer } from "@modules/invoicing/ports/InvoicingDIContainer";

export const InvoicingDIContext = createContext<
  InvoicingDIContainer | undefined
>(undefined);
