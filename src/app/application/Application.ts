import type {
  EndpointModuleKey,
  EndpointModuleMap,
} from "@app/api/EndpointTypes";
import { createEndpointRegistry } from "../api/EndpointRegistry";
import type { EndpointRegistry } from "@app/api/EndpointRegistry";
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

interface ApplicationInfrastructure {
  endpointRegistry: EndpointRegistry;
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
      resolve: (module) => infrastructure.endpointRegistry.resolve(module),
      resolveMultiple: (modules) =>
        infrastructure.endpointRegistry.resolveMultiple(modules),
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
