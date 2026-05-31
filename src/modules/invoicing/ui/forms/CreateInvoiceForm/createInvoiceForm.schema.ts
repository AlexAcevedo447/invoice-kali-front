import { z } from "zod";

export const taxSchema = z.object({
  code: z.string().min(1, "Code is required"),
  kind: z.enum(["DEBIT", "CREDIT"]).default("DEBIT"),
  rate: z.coerce.number().min(0, "Rate must be >= 0"),
});

export const itemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  quantity: z.coerce.number().gt(0, "Quantity must be > 0"),
  unitPrice: z.coerce.number().gt(0, "Unit price must be > 0"),
  taxes: z.array(taxSchema).min(1, "At least one tax is required"),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  items: z.array(itemSchema).min(1, "At least one item is required"),
});

export type CreateInvoiceFormValues = z.infer<typeof createInvoiceSchema>;
