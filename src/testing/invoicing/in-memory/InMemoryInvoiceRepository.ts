import type { Invoice } from "@modules/invoicing/domain/entities/Invoice";
import type { InvoiceRepository } from "@modules/invoicing/domain/repositories/InvoiceRepository";
import { toInvoiceId } from "@modules/invoicing/domain/value-objects/InvoiceId";

const seedInvoices: Invoice[] = [
  {
    id: toInvoiceId("550e8400-e29b-41d4-a716-446655440000"),
    customerId: "customer-001",
    issueDate: new Date("2026-01-10T00:00:00Z"),
    dueDate: new Date("2026-02-10T00:00:00Z"),
    items: [],
    subtotal: 1200,
    taxTotal: 0,
    total: 1200,
    status: "PENDING",
    createdAt: new Date("2026-01-10T10:00:00Z"),
    updatedAt: new Date("2026-01-10T10:00:00Z"),
  },
];

export class InMemoryInvoiceRepository implements InvoiceRepository {
  async list(): Promise<Invoice[]> {
    return seedInvoices;
  }

  async findAll(): Promise<Invoice[]> {
    return this.list();
  }

  async getById(id: Invoice["id"]): Promise<Invoice> {
    const invoice = seedInvoices.find((current) => current.id === id);
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    return invoice;
  }

  async findById(id: Invoice["id"]): Promise<Invoice | null> {
    return seedInvoices.find((invoice) => invoice.id === id) ?? null;
  }

  async create(command: {
    customerId: string;
    issueDate?: string;
    dueDate?: string;
    items: Array<{
      itemId: string;
      quantity: number;
      unitPrice: number;
      taxes: Array<{ code: string; kind?: "DEBIT" | "CREDIT"; rate: number }>;
    }>;
  }): Promise<Invoice> {
    const created: Invoice = {
      id: toInvoiceId(globalThis.crypto?.randomUUID?.() ?? `inv-${Date.now()}`),
      customerId: command.customerId,
      issueDate: command.issueDate ? new Date(command.issueDate) : null,
      dueDate: command.dueDate ? new Date(command.dueDate) : null,
      items: [],
      subtotal: 0,
      taxTotal: 0,
      total: 0,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    seedInvoices.push(created);
    return created;
  }

  async update(command: {
    id: Invoice["id"];
    customerId?: string;
    dueDate?: string;
  }): Promise<Invoice> {
    const invoice = await this.getById(command.id);
    invoice.customerId = command.customerId ?? invoice.customerId;
    invoice.dueDate = command.dueDate
      ? new Date(command.dueDate)
      : invoice.dueDate;
    invoice.updatedAt = new Date();
    return invoice;
  }

  async pay(id: Invoice["id"]): Promise<Invoice> {
    const invoice = await this.getById(id);
    invoice.status = "PAID";
    invoice.updatedAt = new Date();
    return invoice;
  }

  async cancel(id: Invoice["id"]): Promise<Invoice> {
    const invoice = await this.getById(id);
    invoice.status = "CANCELED";
    invoice.updatedAt = new Date();
    return invoice;
  }
}
