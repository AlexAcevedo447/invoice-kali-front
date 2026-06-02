export const ROUTES = {
  home: "/",
  login: "/login",
  admin: {
    root: "/admin",
    users: "/admin/users",
    tenants: "/admin/tenants",
    roles: "/admin/roles",
    permissions: "/admin/permissions",
  },
  invoicing: {
    root: "/invoicing",
    invoices: "/invoicing/invoices",
    invoiceItems: "/invoicing/invoice-items",
  },
} as const;
