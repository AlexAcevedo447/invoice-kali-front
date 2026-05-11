import { useContext } from "react";
import { InvoicingDIContext } from "./InvoicingDIContext";

export function useInvoicingDI() {
  const context = useContext(InvoicingDIContext);
  if (!context) throw new Error("InvoicingDIProvider no encontrado");
  return context;
}
