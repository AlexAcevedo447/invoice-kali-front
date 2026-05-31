import type {
  EndpointModuleKey,
  EndpointModuleMap,
} from "@app/api/EndpointTypes";
import {
  createEndpointRegistry,
  resolveEndpoint,
  resolveMultipleEndpoints,
} from "../api/EndpointRegistry";
import type { EndpointRegistryContext } from "@app/api/EndpointRegistry";
import { createAuthContextHttpRepositories } from "@modules/auth-context/infrastructure/createAuthContextHttpRepositories";
import type { AuthContextRepositories } from "@modules/auth-context/infrastructure/createAuthContextHttpRepositories";
import { createInvoicingHttpRepositories } from "@modules/invoicing/infrastructure/createInvoicingHttpRepositories";
import type { InvoicingRepositories } from "@modules/invoicing/infrastructure/createInvoicingHttpRepositories";
import {
  createAuthContextService,
  type AuthContextService,
} from "./AuthContextService";
import {
  createInvoicingService,
  type InvoicingService,
} from "./InvoicingService";

export interface ApplicationInfrastructure {
  endpointRegistry: EndpointRegistryContext;
  authContextRepositories: AuthContextRepositories;
  invoicingRepositories: InvoicingRepositories;
}

interface EndpointApplicationService {
  resolve<K extends EndpointModuleKey>(
    module: K,
  ): Promise<EndpointModuleMap[K]>;
  resolveMultiple<K extends EndpointModuleKey>(
    modules: readonly K[],
  ): Promise<Record<K, EndpointModuleMap[K]>>;
}

export interface ApplicationServices {
  endpoints: EndpointApplicationService;
  authContext: AuthContextService;
  invoicing: InvoicingService;
}

export const createApplication = (
  infrastructure: ApplicationInfrastructure,
): ApplicationServices => {
  const authContext = createAuthContextService(
    infrastructure.authContextRepositories,
  );
  const invoicing = createInvoicingService(
    infrastructure.invoicingRepositories,
  );

  return {
    endpoints: {
      resolve: (module) =>
        resolveEndpoint(infrastructure.endpointRegistry, module),
      resolveMultiple: (modules) =>
        resolveMultipleEndpoints(infrastructure.endpointRegistry, modules),
    },
    authContext,
    invoicing,
  };
};

export const createDefaultApplication = (): ApplicationServices =>
  createApplication({
    endpointRegistry: createEndpointRegistry(),
    authContextRepositories: createAuthContextHttpRepositories(),
    invoicingRepositories: createInvoicingHttpRepositories(),
  });
