export const InvoiceEndpoints = {
  list: "/api/v1/invoices",
  listPaginated: (page = 1, pageSize = 20) =>
    `/api/v1/invoices?page=${encodeURIComponent(String(page))}&page_size=${encodeURIComponent(String(pageSize))}`,
  getById: (id: string) => `/api/v1/invoices/${encodeURIComponent(id)}`,
  create: "/api/v1/invoices",
  update: (id: string) => `/api/v1/invoices/${encodeURIComponent(id)}`,
  delete: (id: string) => `/api/v1/invoices/${encodeURIComponent(id)}`,
  pay: (id: string) => `/api/v1/invoices/${encodeURIComponent(id)}/pay`,
  cancel: (id: string) => `/api/v1/invoices/${encodeURIComponent(id)}/cancel`,

  invoiceItemsList: (page = 1, pageSize = 20) =>
    `/api/v1/invoice-items?page=${encodeURIComponent(String(page))}&page_size=${encodeURIComponent(String(pageSize))}`,
  invoiceItemsGetById: (id: string) =>
    `/api/v1/invoice-items/${encodeURIComponent(id)}`,
  invoiceItemsCreate: "/api/v1/invoice-items",
  invoiceItemsUpdate: (id: string) =>
    `/api/v1/invoice-items/${encodeURIComponent(id)}`,
  invoiceItemsDelete: (id: string) =>
    `/api/v1/invoice-items/${encodeURIComponent(id)}`,

  metrics: "/api/v1/metrics",
} as const;
