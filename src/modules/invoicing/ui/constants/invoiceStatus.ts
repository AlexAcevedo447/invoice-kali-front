export type InvoiceStatus =
  | "draft"
  | "pending"
  | "paid"
  | "overdue"
  | "cancelled";

export interface InvoiceStatusInfo {
  value: InvoiceStatus;
  label: string;
  color: string;
  description: string;
}

export const INVOICE_STATUS_MAP: Record<InvoiceStatus, InvoiceStatusInfo> = {
  draft: {
    value: "draft",
    label: "Borrador",
    color: "var(--gray-500)",
    description: "Factura en edición",
  },
  pending: {
    value: "pending",
    label: "Pendiente",
    color: "var(--orange-500)",
    description: "Esperando pago",
  },
  paid: {
    value: "paid",
    label: "Pagada",
    color: "var(--green-500)",
    description: "Pago recibido",
  },
  overdue: {
    value: "overdue",
    label: "Vencida",
    color: "var(--red-500)",
    description: "Pago vencido",
  },
  cancelled: {
    value: "cancelled",
    label: "Cancelada",
    color: "var(--surface-500)",
    description: "Factura cancelada",
  },
};

export const getStatusInfo = (status: InvoiceStatus): InvoiceStatusInfo =>
  INVOICE_STATUS_MAP[status];
