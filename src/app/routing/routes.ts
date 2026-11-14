export const ROUTES = {
  home: "/",
  login: "/login",
  /** Sesión válida sin permisos sobre ningún módulo. */
  noAccess: "/sin-acceso",
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
    customers: "/invoicing/customers",
    products: "/invoicing/products",
    invoiceItems: "/invoicing/invoice-items",
  },
} as const;
