import { createInvoicingDIContainer } from "@modules/invoicing/createInvoicingDIContainer";
import { httpCore } from "@shared/infrastructure/http/httpCore";
import { createEndpointRegistry } from "@app/api/EndpointRegistry";
// Factory async para DI container lazy/diferido, solo API moderna (hooks)
export async function getInvoicingDIContainer() {
  const createInvoicingDIContainerModule =
    await import("@modules/invoicing/createInvoicingDIContainer");
  const { createInvoicingDIContainer } = createInvoicingDIContainerModule;
  const [
    mappers,
    httpConfig,
    { createHttpInvoiceRepository },
    { createHttpInvoiceItemRepository },
    { createHttpInvoiceMetricsRepository },
  ] = await Promise.all([
    import("@modules/invoicing/infrastructure/mappers/invoiceMapper"),
    import("@modules/invoicing/infrastructure/adapters/httpConfig"),
    import("@modules/invoicing/infrastructure/adapters/createHttpInvoiceRepository"),
    import("@modules/invoicing/infrastructure/adapters/createHttpInvoiceItemRepository"),
    import("@modules/invoicing/infrastructure/adapters/createHttpInvoiceMetricsRepository"),
  ]);

  // Repositorios DI: factories modernas
  const repositories = {
    invoiceRepository: createHttpInvoiceRepository({
      httpClient: httpCore,
      endpointRegistry: createEndpointRegistry(),
    }),
    invoiceItemRepository: createHttpInvoiceItemRepository({
      httpClient: httpCore,
      endpointRegistry: createEndpointRegistry(),
    }),
    invoiceMetricsRepository: createHttpInvoiceMetricsRepository({
      httpClient: httpCore,
      endpointRegistry: createEndpointRegistry(),
    }),
  };

  // Importar hooks de casos de uso existentes
  const useInvoiceCommandHooks =
    await import("@modules/invoicing/application/use-cases/useInvoiceCommandHooks");
  const useInvoiceItemQueryHooks =
    await import("@modules/invoicing/application/use-cases/useInvoiceItemQueryHooks");
  const useInvoiceQueryHook =
    await import("@modules/invoicing/application/use-cases/useInvoiceQueryHook");
  const useInvoiceItemCommandHooks =
    await import("@modules/invoicing/application/use-cases/useInvoiceItemCommandHooks");
  const useMetricsHook =
    await import("@modules/invoicing/application/use-cases/useMetricsHook");

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
