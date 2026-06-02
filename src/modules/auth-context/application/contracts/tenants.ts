import type {
  Tenant,
  TenantStatus,
} from "@modules/auth-context/domain/entities/Tenant";

export interface CreateTenantCommand {
  name: string;
}

export interface GetTenantByIdQuery {
  tenantId: string;
}

export interface GetTenantByNameQuery {
  name: string;
}

export interface UpdateTenantCommand {
  tenantId: string;
  name: string;
  status: TenantStatus;
}

export interface ChangeTenantStatusCommand {
  tenantId: string;
}

export type TenantResult = Tenant;
export type TenantListResult = Tenant[];
