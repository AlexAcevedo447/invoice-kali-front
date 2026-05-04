import { create } from "zustand";
import type { ApplicationServices } from "@app/application";
import type {
  Invoice,
  InvoiceItem,
  InvoiceMetrics,
} from "@modules/invoicing/domain/entities";
import { createIdempotencyKey } from "./createIdempotencyKey";

type InvoicingService = ApplicationServices["invoicing"];

interface InvoicingState {
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  selectedInvoice: Invoice | null;
  selectedInvoiceItem: InvoiceItem | null;
  metrics: InvoiceMetrics | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  actions: {
    loadInvoices(page?: number, pageSize?: number): Promise<void>;
    loadInvoice(id: string): Promise<void>;
    createInvoice(command: {
      customerId: string;
      issueDate?: string;
      dueDate?: string;
      items: Array<{
        itemId: string;
        quantity: number;
        unitPrice: number;
        taxes: Array<{ code: string; kind?: "DEBIT" | "CREDIT"; rate: number }>;
      }>;
    }): Promise<Invoice | null>;
    updateInvoice(command: {
      id: string;
      customerId?: string;
      dueDate?: string;
    }): Promise<Invoice | null>;
    payInvoice(id: string): Promise<Invoice | null>;
    cancelInvoice(id: string): Promise<Invoice | null>;
    loadInvoiceItems(page?: number, pageSize?: number): Promise<void>;
    loadInvoiceItem(id: string): Promise<void>;
    createInvoiceItem(command: {
      invoiceId: string;
      itemId: string;
      quantity: number;
      unitPrice: number;
      taxes: Array<{ code: string; kind?: "DEBIT" | "CREDIT"; rate: number }>;
    }): Promise<InvoiceItem | null>;
    updateInvoiceItem(command: {
      id: string;
      quantity: number;
      unitPrice: number;
      taxes: Array<{ code: string; kind?: "DEBIT" | "CREDIT"; rate: number }>;
    }): Promise<InvoiceItem | null>;
    deleteInvoiceItem(id: string): Promise<boolean>;
    loadMetrics(): Promise<void>;
    clearError(): void;
  };
}

let invoicingService: InvoicingService | null = null;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
};

export const configureInvoicingStore = (service: InvoicingService): void => {
  invoicingService = service;
};

export const useInvoicingStore = create<InvoicingState>((set, get) => ({
  invoices: [],
  invoiceItems: [],
  selectedInvoice: null,
  selectedInvoiceItem: null,
  metrics: null,
  isLoading: false,
  error: null,
  page: 1,
  pageSize: 20,
  actions: {
    async loadInvoices(page = get().page, pageSize = get().pageSize) {
      if (!invoicingService) {
        throw new Error("InvoicingService is not configured");
      }

      set({ isLoading: true, error: null });

      try {
        const invoices = await invoicingService.invoices.list({
          page,
          pageSize,
        });
        set({ invoices, page, pageSize, isLoading: false });
      } catch (error) {
        set({ isLoading: false, error: getErrorMessage(error) });
      }
    },

    async loadInvoice(id) {
      if (!invoicingService) {
        throw new Error("InvoicingService is not configured");
      }

      set({ isLoading: true, error: null });

      try {
        const selectedInvoice = await invoicingService.invoices.getById({ id });
        set({ selectedInvoice, isLoading: false });
      } catch (error) {
        set({ isLoading: false, error: getErrorMessage(error) });
      }
    },

    async createInvoice(command) {
      if (!invoicingService) {
        throw new Error("InvoicingService is not configured");
      }

      set({ isLoading: true, error: null });

      try {
        const invoice = await invoicingService.invoices.create(command, {
          idempotencyKey: createIdempotencyKey(),
        });
        set((state) => ({
          invoices: [invoice, ...state.invoices],
          selectedInvoice: invoice,
          isLoading: false,
        }));
        return invoice;
      } catch (error) {
        set({ isLoading: false, error: getErrorMessage(error) });
        return null;
      }
    },

    async updateInvoice(command) {
      if (!invoicingService) {
        throw new Error("InvoicingService is not configured");
      }

      set({ isLoading: true, error: null });

      try {
        const invoice = await invoicingService.invoices.update(command, {
          idempotencyKey: createIdempotencyKey(),
        });
        set((state) => ({
          invoices: state.invoices.map((current) =>
            current.id === invoice.id ? invoice : current,
          ),
          selectedInvoice: invoice,
          isLoading: false,
        }));
        return invoice;
      } catch (error) {
        set({ isLoading: false, error: getErrorMessage(error) });
        return null;
      }
    },

    async payInvoice(id) {
      if (!invoicingService) {
        throw new Error("InvoicingService is not configured");
      }

      set({ isLoading: true, error: null });

      try {
        const invoice = await invoicingService.invoices.pay(
          { id },
          { idempotencyKey: createIdempotencyKey() },
        );
        set((state) => ({
          invoices: state.invoices.map((current) =>
            current.id === invoice.id ? invoice : current,
          ),
          selectedInvoice: invoice,
          isLoading: false,
        }));
        return invoice;
      } catch (error) {
        set({ isLoading: false, error: getErrorMessage(error) });
        return null;
      }
    },

    async cancelInvoice(id) {
      if (!invoicingService) {
        throw new Error("InvoicingService is not configured");
      }

      set({ isLoading: true, error: null });

      try {
        const invoice = await invoicingService.invoices.cancel(
          { id },
          { idempotencyKey: createIdempotencyKey() },
        );
        set((state) => ({
          invoices: state.invoices.map((current) =>
            current.id === invoice.id ? invoice : current,
          ),
          selectedInvoice: invoice,
          isLoading: false,
        }));
        return invoice;
      } catch (error) {
        set({ isLoading: false, error: getErrorMessage(error) });
        return null;
      }
    },

    async loadInvoiceItems(page = get().page, pageSize = get().pageSize) {
      if (!invoicingService) {
        throw new Error("InvoicingService is not configured");
      }

      set({ isLoading: true, error: null });

      try {
        const invoiceItems = await invoicingService.invoiceItems.list({
          page,
          pageSize,
        });
        set({ invoiceItems, isLoading: false });
      } catch (error) {
        set({ isLoading: false, error: getErrorMessage(error) });
      }
    },

    async loadInvoiceItem(id) {
      if (!invoicingService) {
        throw new Error("InvoicingService is not configured");
      }

      set({ isLoading: true, error: null });

      try {
        const selectedInvoiceItem = await invoicingService.invoiceItems.getById(
          {
            id,
          },
        );
        set({ selectedInvoiceItem, isLoading: false });
      } catch (error) {
        set({ isLoading: false, error: getErrorMessage(error) });
      }
    },

    async createInvoiceItem(command) {
      if (!invoicingService) {
        throw new Error("InvoicingService is not configured");
      }

      set({ isLoading: true, error: null });

      try {
        const invoiceItem = await invoicingService.invoiceItems.create(
          command,
          {
            idempotencyKey: createIdempotencyKey(),
          },
        );
        set((state) => ({
          invoiceItems: [invoiceItem, ...state.invoiceItems],
          selectedInvoiceItem: invoiceItem,
          isLoading: false,
        }));
        return invoiceItem;
      } catch (error) {
        set({ isLoading: false, error: getErrorMessage(error) });
        return null;
      }
    },

    async updateInvoiceItem(command) {
      if (!invoicingService) {
        throw new Error("InvoicingService is not configured");
      }

      set({ isLoading: true, error: null });

      try {
        const invoiceItem = await invoicingService.invoiceItems.update(
          command,
          {
            idempotencyKey: createIdempotencyKey(),
          },
        );
        set((state) => ({
          invoiceItems: state.invoiceItems.map((current) =>
            current.id === invoiceItem.id ? invoiceItem : current,
          ),
          selectedInvoiceItem: invoiceItem,
          isLoading: false,
        }));
        return invoiceItem;
      } catch (error) {
        set({ isLoading: false, error: getErrorMessage(error) });
        return null;
      }
    },

    async deleteInvoiceItem(id) {
      if (!invoicingService) {
        throw new Error("InvoicingService is not configured");
      }

      set({ isLoading: true, error: null });

      try {
        await invoicingService.invoiceItems.delete(
          { id },
          { idempotencyKey: createIdempotencyKey() },
        );
        set((state) => ({
          invoiceItems: state.invoiceItems.filter((item) => item.id !== id),
          selectedInvoiceItem:
            state.selectedInvoiceItem?.id === id
              ? null
              : state.selectedInvoiceItem,
          isLoading: false,
        }));
        return true;
      } catch (error) {
        set({ isLoading: false, error: getErrorMessage(error) });
        return false;
      }
    },

    async loadMetrics() {
      if (!invoicingService) {
        throw new Error("InvoicingService is not configured");
      }

      set({ isLoading: true, error: null });

      try {
        const metrics = await invoicingService.metrics.get();
        set({ metrics, isLoading: false });
      } catch (error) {
        set({ isLoading: false, error: getErrorMessage(error) });
      }
    },

    clearError() {
      set({ error: null });
    },
  },
}));
