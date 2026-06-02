import { createInvoicingDIContainer } from "./createInvoicingDIContainer";
// Factory async para DI container lazy/diferido, solo API moderna (hooks)
export async function getInvoicingDIContainer() {
  const createInvoicingDIContainerModule =
    await import("./createInvoicingDIContainer");
  const { createInvoicingDIContainer } = createInvoicingDIContainerModule;
  const [
    mappers,
    httpConfig,
    { createHttpInvoiceRepository },
    { createHttpInvoiceItemRepository },
    { createHttpInvoiceMetricsRepository },
  ] = await Promise.all([
    import("./infrastructure/mappers/invoiceMapper"),
    import("./infrastructure/adapters/httpConfig"),
    import("./infrastructure/adapters/useHttpInvoiceRepository"),
    import("./infrastructure/adapters/useHttpInvoiceItemRepository"),
    import("./infrastructure/adapters/useHttpInvoiceMetricsRepository"),
  ]);

  // Repositorios DI: factories modernas
  const repositories = {
    invoiceRepository: createHttpInvoiceRepository(),
    invoiceItemRepository: createHttpInvoiceItemRepository(),
    invoiceMetricsRepository: createHttpInvoiceMetricsRepository(),
  };

  // Importar hooks de casos de uso existentes
  const useInvoiceCommandHooks =
    await import("./application/use-cases/useInvoiceCommandHooks");
  const useInvoiceItemQueryHooks =
    await import("./application/use-cases/useInvoiceItemQueryHooks");
  const useInvoiceQueryHook =
    await import("./application/use-cases/useInvoiceQueryHook");
  const useInvoiceItemCommandHooks =
    await import("./application/use-cases/useInvoiceItemCommandHooks");
  const useMetricsHook = await import("./application/use-cases/useMetricsHook");

  const container = createInvoicingDIContainer({
    repositories,
    factories: {
      // Si ya no usas createInvoicingHttpRepositories, puedes eliminarlo de factories
      mappers: {
        mapInvoiceApiToDomain: mappers.mapInvoiceApiToDomain,
        mapInvoiceItemApiToDomain: mappers.mapInvoiceItemApiToDomain,
        mapInvoiceTaxApiToDomain: mappers.mapInvoiceTaxApiToDomain,
        mapInvoiceMetricsApiToDomain: mappers.mapInvoiceMetricsApiToDomain,
      },
      httpConfig: {
        toPublicConfig: httpConfig.toPublicConfig,
        toIdempotentConfig: httpConfig.toIdempotentConfig,
      },
    },
    useCases: containerTypeEnforcement(),
  });

  return {
    ...container,
    hooks: {
      ...useInvoiceCommandHooks,
      ...useInvoiceItemQueryHooks,
      ...useInvoiceQueryHook,
      ...useInvoiceItemCommandHooks,
      ...useMetricsHook,
    },
  };
}

// Esta función es solo para cumplir el tipo, puedes eliminarla cuando migres toda la API
function containerTypeEnforcement(): ReturnType<
  typeof createInvoicingDIContainer
>["useCases"] {
  return {} as ReturnType<typeof createInvoicingDIContainer>["useCases"];
}
