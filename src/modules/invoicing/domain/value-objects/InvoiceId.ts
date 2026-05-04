import type { Brand } from "@core/types/brand";

export type InvoiceId = Brand<string, "InvoiceId">;

export const toInvoiceId = (value: string): InvoiceId => value as InvoiceId;
