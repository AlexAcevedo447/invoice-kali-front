import type { AuthSession } from "../../domain/entities/AuthSession";
import type { AuthorizationDecision } from "../../domain/entities/AuthorizationDecision";
import type { Permission } from "../../domain/entities/Permission";
import type { PermissionCatalog } from "../../domain/entities/PermissionCatalog";
import type { Role } from "../../domain/entities/Role";
import type { ServiceHealth } from "../../domain/entities/ServiceHealth";
import type { Tenant } from "../../domain/entities/Tenant";
import type { User } from "../../domain/entities/User";
import { toPermissionId, type PermissionId } from "../../domain/value-objects/PermissionId";
import { toRoleId, type RoleId } from "../../domain/value-objects/RoleId";
import { toTenantId } from "../../domain/value-objects/TenantId";
import { toUserId } from "../../domain/value-objects/UserId";
export interface ApiHealthResponse {
  service: string;
  status: string;
}

export interface ApiAuthSessionPermission {
  id: string;
  resource: string;
  action: string;
}

export interface ApiAuthSessionResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  tenant_id: string;
  tenant_name: string;
  tenant_code: string;
  /** Ausente en versiones anteriores del servicio: se interpreta como false. */
  is_platform_tenant?: boolean;
  user_id: string;
  email: string;
  needs_rehash: boolean;
  roles: string[];
  permissions: ApiAuthSessionPermission[];
}

export interface ApiAuthorizationDecision {
  allowed: boolean;
  reason?: string;
}

// Auth serializa sus entidades de dominio sin tags JSON: las claves llegan en
// PascalCase (Id, TenantId, ...). Verificado contra GET /users, /roles, etc.
// El servidor ya no devuelve Password; si llegara, el mapper lo ignora.
export interface ApiUser {
  Id: string;
  TenantId: string;
  IdentificationNumber: string;
  Username: string;
  Email: string;
}

export interface ApiTenant {
  Id: string;
  Name: string;
  /** Código legible de empresa (3-40 minúsculas, dígitos o guiones). */
  Code: string;
  Status: "ACTIVE" | "SUSPENDED";
}

export interface ApiRole {
  Id: string;
  TenantId: string;
  Name: string;
  Description: string;
}

export interface ApiPermission {
  Id: string;
  TenantId: string;
  Resource: string;
  Action: string;
}

/** Vínculo usuario↔rol (GET /rbac/users/roles). */
export interface ApiUserRoleLink {
  TenantId?: string;
  UserId?: string;
  RoleId?: string;
  /** Tolerancia: algunas versiones podrían devolver el rol completo. */
  Id?: string;
}

/** Vínculo rol↔permiso (GET /rbac/roles/permissions). */
export interface ApiRolePermissionLink {
  TenantId?: string;
  RoleId?: string;
  PermissionId?: string;
  /** Tolerancia: algunas versiones podrían devolver el permiso completo. */
  Id?: string;
}

export interface ApiPermissionCatalog {
  resources?: Array<{ resource: string; actions?: string[] | null }> | null;
}

export const mapHealthApiToDomain = (
  input: ApiHealthResponse,
): ServiceHealth => ({
  service: input.service,
  status: input.status,
});

export const mapAuthSessionApiToDomain = (
  input: ApiAuthSessionResponse,
): AuthSession => ({
  accessToken: input.access_token,
  tokenType: input.token_type,
  expiresIn: input.expires_in,
  tenantId: toTenantId(input.tenant_id),
  tenantName: input.tenant_name,
  tenantCode: input.tenant_code,
  isPlatformTenant: input.is_platform_tenant === true,
  userId: toUserId(input.user_id),
  email: input.email,
  needsRehash: input.needs_rehash,
  roles: input.roles,
  permissions: input.permissions.map((p) => ({
    id: toPermissionId(p.id),
    resource: p.resource,
    action: p.action,
  })),
});

export const mapAuthorizationApiToDomain = (
  input: ApiAuthorizationDecision,
): AuthorizationDecision => ({
  allowed: input.allowed,
  reason: input.reason,
});

/** Solo copia los campos públicos: nunca la contraseña ni su hash. */
export const mapUserApiToDomain = (input: ApiUser): User => ({
  id: toUserId(input.Id),
  tenantId: toTenantId(input.TenantId),
  identificationNumber: input.IdentificationNumber,
  username: input.Username,
  email: input.Email,
});

export const mapTenantApiToDomain = (input: ApiTenant): Tenant => ({
  id: toTenantId(input.Id),
  name: input.Name,
  code: input.Code ?? "",
  status: input.Status,
});

export const mapRoleApiToDomain = (input: ApiRole): Role => ({
  id: toRoleId(input.Id),
  tenantId: toTenantId(input.TenantId),
  name: input.Name,
  description: input.Description,
});

export const mapPermissionApiToDomain = (input: ApiPermission): Permission => ({
  id: toPermissionId(input.Id),
  tenantId: toTenantId(input.TenantId),
  resource: input.Resource,
  action: input.Action,
});

const uniqueIds = <T extends string>(ids: Array<string | undefined>, brand: (v: string) => T): T[] =>
  [...new Set(ids.filter((id): id is string => typeof id === "string" && id !== ""))].map(brand);

export const mapUserRoleLinksToRoleIds = (
  input: ApiUserRoleLink[] | null | undefined,
): RoleId[] => uniqueIds((input ?? []).map((link) => link.RoleId ?? link.Id), toRoleId);

export const mapRolePermissionLinksToPermissionIds = (
  input: ApiRolePermissionLink[] | null | undefined,
): PermissionId[] =>
  uniqueIds((input ?? []).map((link) => link.PermissionId ?? link.Id), toPermissionId);

/** Normaliza el catálogo: recursos y acciones en minúsculas y sin espacios. */
export const mapPermissionCatalogApiToDomain = (
  input: ApiPermissionCatalog | null | undefined,
): PermissionCatalog => ({
  resources: (input?.resources ?? []).map((entry) => ({
    resource: entry.resource.trim().toLowerCase(),
    actions: (entry.actions ?? []).map((action) => action.trim().toLowerCase()),
  })),
});
