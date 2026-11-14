import type {
  Tenant,
  TenantStatus,
} from "@modules/auth-context/domain/entities/Tenant";
import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
} from "@modules/auth-context/domain/repositories/RequestOptions";
import type { TenantId } from "../value-objects/TenantId";

export interface TenantRepository {
  /** Si se omite el código, el servidor lo deriva del nombre. */
  create(
    command: { name: string; code?: string },
    options: IdempotentProtectedRequestOptions,
  ): Promise<Tenant>;

  list(options: ProtectedRequestOptions): Promise<Tenant[]>;

  getById(
    query: { tenantId: TenantId },
    options: ProtectedRequestOptions,
  ): Promise<Tenant>;

  getByName(
    query: { name: string },
    options: ProtectedRequestOptions,
  ): Promise<Tenant>;

  update(
    command: { tenantId: TenantId; name: string; code: string; status: TenantStatus },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;

  activate(
    command: { tenantId: TenantId },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;

  suspend(
    command: { tenantId: TenantId },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;
}
