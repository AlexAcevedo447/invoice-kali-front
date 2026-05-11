import { createContext } from "react";
import type { InvoicingDIContainer } from "./InvoicingDIProvider";

export const InvoicingDIContext = createContext<
  InvoicingDIContainer | undefined
>(undefined);
