import { httpCore } from "@shared/infrastructure/http/httpCore";
import type {
  CatalogPage,
  Customer,
  Product,
} from "@modules/invoicing/domain/entities/Catalog";
import { createIdempotencyKey } from "@app/state/createIdempotencyKey";

/**
 * Catálogos de facturación del tenant autenticado. El servidor toma el tenant
 * del token; el frontend nunca lo envía. Los UUID se reciben y guardan en
 * estado interno, pero el usuario solo ve nombres, documentos y códigos.
 */

interface CustomerApi {
  ID: string;
  Name: string;
  Document: string;
}

interface ProductApi {
  ID: string;
  Code: string;
  Name: string;
  UnitPrice: number;
}

const CUSTOMERS = "/api/v1/customers";
const PRODUCTS = "/api/v1/products";

const toCustomer = (c: CustomerApi): Customer => ({
  id: c.ID,
  name: c.Name,
  document: c.Document,
});

const toProduct = (p: ProductApi): Product => ({
  id: p.ID,
  code: p.Code,
  name: p.Name,
  unitPrice: p.UnitPrice,
});

const totalFrom = (headers: Record<string, string>, fallback: number) => {
  const total = Number(headers["x-total-count"]);
  return Number.isFinite(total) ? total : fallback;
};

export const catalogApi = {
  async listCustomers(search = "", page = 1, pageSize = 20): Promise<CatalogPage<Customer>> {
    const { data, headers } = await httpCore.getWithMeta<CustomerApi[]>(CUSTOMERS, {
      params: { search, page, page_size: pageSize },
    });
    return { items: data.map(toCustomer), total: totalFrom(headers, data.length) };
  },

  async createCustomer(input: { name: string; document: string }): Promise<Customer> {
    const created = await httpCore.post<CustomerApi, { name: string; document: string }>(
      CUSTOMERS,
      input,
      { idempotencyKey: createIdempotencyKey() },
    );
    return toCustomer(created);
  },

  async listProducts(search = "", page = 1, pageSize = 20): Promise<CatalogPage<Product>> {
    const { data, headers } = await httpCore.getWithMeta<ProductApi[]>(PRODUCTS, {
      params: { search, page, page_size: pageSize },
    });
    return { items: data.map(toProduct), total: totalFrom(headers, data.length) };
  },

  async createProduct(input: { code: string; name: string; unitPrice: number }): Promise<Product> {
    const created = await httpCore.post<
      ProductApi,
      { code: string; name: string; unit_price: number }
    >(
      PRODUCTS,
      { code: input.code, name: input.name, unit_price: input.unitPrice },
      { idempotencyKey: createIdempotencyKey() },
    );
    return toProduct(created);
  },
};
