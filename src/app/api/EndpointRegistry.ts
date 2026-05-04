import type {
  EndpointFactory,
  EndpointModuleKey,
  EndpointModuleMap,
} from "./EndpointTypes";
import { InvoiceEndpoints } from "@modules/invoicing/application/endpoints";

export class EndpointRegistry {
  private factories = new Map<
    EndpointModuleKey,
    EndpointFactory<EndpointModuleKey>
  >();
  private cache = new Map<
    EndpointModuleKey,
    EndpointModuleMap[EndpointModuleKey]
  >();

  register<K extends EndpointModuleKey>(
    module: K,
    factory: EndpointFactory<K>,
  ): void {
    this.factories.set(module, factory as EndpointFactory<EndpointModuleKey>);
  }

  async resolve<K extends EndpointModuleKey>(
    module: K,
  ): Promise<EndpointModuleMap[K]> {
    if (!this.cache.has(module)) {
      const factory = this.factories.get(module);
      if (!factory) {
        throw new Error(`Module ${module} not registered`);
      }
      const endpoints = (await factory()) as EndpointModuleMap[K];
      this.cache.set(module, endpoints);
    }
    return this.cache.get(module) as EndpointModuleMap[K];
  }

  async resolveMultiple<K extends EndpointModuleKey>(
    modules: readonly K[],
  ): Promise<Record<K, EndpointModuleMap[K]>> {
    const results: Partial<Record<K, EndpointModuleMap[K]>> = {};
    for (const module of modules) {
      results[module] = await this.resolve(module);
    }
    return results as Record<K, EndpointModuleMap[K]>;
  }
}

const registerEndpointModules = (endpointRegistry: EndpointRegistry): void => {
  endpointRegistry.register("health" as const, () =>
    import("./endpoints/health").then((m) => ({
      health: m.HealthEndpoints,
    })),
  );

  endpointRegistry.register("auth" as const, () =>
    import("./endpoints/auth").then((m) => ({
      auth: m.AuthEndpoints,
    })),
  );

  endpointRegistry.register("users" as const, () =>
    import("./endpoints/users").then((m) => ({
      users: m.UserEndpoints,
    })),
  );

  endpointRegistry.register("tenants" as const, () =>
    import("./endpoints/tenants").then((m) => ({
      tenants: m.TenantEndpoints,
    })),
  );

  endpointRegistry.register("roles" as const, () =>
    import("./endpoints/roles").then((m) => ({
      roles: m.RoleEndpoints,
    })),
  );

  endpointRegistry.register("permissions" as const, () =>
    import("./endpoints/permissions").then((m) => ({
      permissions: m.PermissionEndpoints,
    })),
  );

  endpointRegistry.register("rbac" as const, () =>
    import("./endpoints/rbac").then((m) => ({
      rbac: m.RbacEndpoints,
    })),
  );

  endpointRegistry.register("invoices" as const, () =>
    Promise.resolve({
      invoices: InvoiceEndpoints,
    }),
  );
};

export const createEndpointRegistry = (): EndpointRegistry => {
  const endpointRegistry = new EndpointRegistry();
  registerEndpointModules(endpointRegistry);
  return endpointRegistry;
};

// Compatibilidad para código legacy.
export const endpointRegistry = createEndpointRegistry();
