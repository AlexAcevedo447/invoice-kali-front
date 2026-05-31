import type { Invoice } from "../../../domain/entities/Invoice";

export interface CreateInvoiceFormProps {
  invoiceToEdit?: Invoice | null;
  onSuccess?: () => void;
}
