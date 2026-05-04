import type { Brand } from "@core/types/brand";

export type InvoiceTaxId = Brand<string, "InvoiceTaxId">;

export const toInvoiceTaxId = (value: string): InvoiceTaxId =>
  value as InvoiceTaxId;
