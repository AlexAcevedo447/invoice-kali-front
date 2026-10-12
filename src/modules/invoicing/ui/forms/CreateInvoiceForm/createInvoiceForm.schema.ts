import { z } from "zod";

export const taxSchema = z.object({
  code: z.string().min(1, "Code is required"),
  kind: z.enum(["DEBIT", "CREDIT"]).default("DEBIT"),
  rate: z.coerce.number().min(0, "Rate must be >= 0"),
});

export const itemSchema = z.object({
  // El servicio de facturación exige UUID en item_id y customer_id.
  itemId: z
    .string()
    .min(1, "Item ID is required")
    .uuid("Item ID must be a valid UUID"),
  quantity: z.coerce.number().gt(0, "Quantity must be > 0"),
  unitPrice: z.coerce.number().gt(0, "Unit price must be > 0"),
  taxes: z.array(taxSchema).min(1, "At least one tax is required"),
});

export const createInvoiceSchema = z
  .object({
    customerId: z
      .string()
      .min(1, "Customer ID is required")
      .uuid("Customer ID must be a valid UUID"),
    issueDate: z.string().optional(),
    dueDate: z.string().optional(),
    items: z.array(itemSchema).min(1, "At least one item is required"),
  })
  // El backend rechaza due_date anterior a issue_date.
  .refine(
    (values) =>
      !values.issueDate ||
      !values.dueDate ||
      new Date(values.dueDate).getTime() >= new Date(values.issueDate).getTime(),
    { path: ["dueDate"], message: "Due date must be on or after issue date" },
  );

export type CreateInvoiceFormValues = z.infer<typeof createInvoiceSchema>;
