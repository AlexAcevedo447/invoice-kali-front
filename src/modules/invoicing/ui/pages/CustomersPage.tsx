import { CatalogManager } from "@modules/invoicing/ui/components/CatalogManager";
import { catalogApi } from "@modules/invoicing/infrastructure/catalog/catalogApi";
import type { Customer } from "@modules/invoicing/domain/entities/Catalog";

const listCustomers = (search: string, page: number, pageSize: number) =>
    catalogApi.listCustomers(search, page, pageSize);

const createCustomer = (values: Record<string, string>) =>
    catalogApi.createCustomer({ name: values.name.trim(), document: values.document.trim() });

export const CustomersPage = () => (
    <CatalogManager<Customer>
        title="Clientes"
        cy="customer"
        createTitle="Nuevo cliente"
        createLabel="Crear cliente"
        successSummary="Cliente creado"
        searchPlaceholder="Buscar por nombre o documento"
        emptyMessage="No hay clientes registrados"
        fields={[
            { name: "name", label: "Nombre o razón social", type: "text", requiredMessage: "El nombre es obligatorio" },
            { name: "document", label: "Documento (NIT / CC)", type: "text", requiredMessage: "El documento es obligatorio" },
        ]}
        columns={[
            { field: "name", header: "Nombre", sortable: true },
            { field: "document", header: "Documento", sortable: true },
        ]}
        list={listCustomers}
        create={createCustomer}
    />
);
