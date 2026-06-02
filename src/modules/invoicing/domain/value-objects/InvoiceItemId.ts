import type { Brand } from "@core/types/brand";

export type InvoiceItemId = Brand<string, "InvoiceItemId">;

export const toInvoiceItemId = (value: string): InvoiceItemId =>
  value as InvoiceItemId;
