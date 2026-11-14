/** Cliente de la empresa: el usuario lo elige por nombre o documento. */
export interface Customer {
  id: string;
  name: string;
  document: string;
}

/** Producto o servicio facturable: el usuario lo elige por código o nombre. */
export interface Product {
  id: string;
  code: string;
  name: string;
  unitPrice: number;
}

export interface CatalogPage<T> {
  items: T[];
  total: number;
}
