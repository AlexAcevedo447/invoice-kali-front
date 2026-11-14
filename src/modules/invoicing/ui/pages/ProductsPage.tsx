import { CatalogManager } from "@modules/invoicing/ui/components/CatalogManager";
import { catalogApi } from "@modules/invoicing/infrastructure/catalog/catalogApi";
import type { Product } from "@modules/invoicing/domain/entities/Catalog";

const listProducts = (search: string, page: number, pageSize: number) =>
    catalogApi.listProducts(search, page, pageSize);

const createProduct = (values: Record<string, string>) =>
    catalogApi.createProduct({
        code: values.code.trim(),
        name: values.name.trim(),
        unitPrice: values.unitPrice.trim() === "" ? 0 : Number(values.unitPrice),
    });

export const ProductsPage = () => (
    <CatalogManager<Product>
        title="Productos"
        cy="product"
        createTitle="Nuevo producto"
        createLabel="Crear producto"
        successSummary="Producto creado"
        searchPlaceholder="Buscar por código o nombre"
        emptyMessage="No hay productos registrados"
        fields={[
            { name: "code", label: "Código / referencia", type: "text", requiredMessage: "El código es obligatorio" },
            { name: "name", label: "Nombre", type: "text", requiredMessage: "El nombre es obligatorio" },
            { name: "unitPrice", label: "Precio unitario", type: "number", min: 0 },
        ]}
        columns={[
            { field: "code", header: "Código", sortable: true },
            { field: "name", header: "Nombre", sortable: true },
            {
                field: "unitPrice",
                header: "Precio unitario",
                sortable: true,
                body: (row) => `$${row.unitPrice.toFixed(2)}`,
            },
        ]}
        list={listProducts}
        create={createProduct}
    />
);
