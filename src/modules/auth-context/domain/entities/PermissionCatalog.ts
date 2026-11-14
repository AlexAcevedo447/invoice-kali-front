/** Catálogo de recursos y acciones permitidos (GET /api/v1/permissions/catalog). */
export interface PermissionCatalogEntry {
  resource: string;
  actions: string[];
}

export interface PermissionCatalog {
  resources: PermissionCatalogEntry[];
}
