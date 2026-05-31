import type {
  EndpointFactory,
  EndpointModuleKey,
  EndpointModuleMap,
} from "./EndpointTypes";

// Contexto de registro de endpoints
export interface EndpointRegistryContext {
  factories: Map<EndpointModuleKey, EndpointFactory<EndpointModuleKey>>;
  cache: Map<EndpointModuleKey, EndpointModuleMap[EndpointModuleKey]>;
}

export const createEndpointRegistry = (): EndpointRegistryContext => ({
  factories: new Map(),
  cache: new Map(),
});

export function registerEndpoint<K extends EndpointModuleKey>(
  ctx: EndpointRegistryContext,
  module: K,
  factory: EndpointFactory<K>,
): void {
  ctx.factories.set(module, factory as EndpointFactory<EndpointModuleKey>);
}

export async function resolveEndpoint<K extends EndpointModuleKey>(
  ctx: EndpointRegistryContext,
  module: K,
): Promise<EndpointModuleMap[K]> {
  if (!ctx.cache.has(module)) {
    const factory = ctx.factories.get(module);
    if (!factory) {
      throw new Error(`Module ${module} not registered`);
    }
    const endpoints = (await factory()) as EndpointModuleMap[K];
    ctx.cache.set(module, endpoints);
  }
  return ctx.cache.get(module) as EndpointModuleMap[K];
}

export async function resolveMultipleEndpoints<K extends EndpointModuleKey>(
  ctx: EndpointRegistryContext,
  modules: readonly K[],
): Promise<Record<K, EndpointModuleMap[K]>> {
  const results: Partial<Record<K, EndpointModuleMap[K]>> = {};
  for (const module of modules) {
    results[module] = await resolveEndpoint(ctx, module);
  }
  return results as Record<K, EndpointModuleMap[K]>;
}
