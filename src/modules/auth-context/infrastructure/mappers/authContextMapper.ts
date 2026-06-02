import type {
  AuthSession,
  AuthorizationDecision,
  Permission,
  Role,
  ServiceHealth,
  Tenant,
  User,
} from "@modules/auth-context/domain/entities";
import {
  toPermissionId,
  toRoleId,
  toTenantId,
  toUserId,
} from "@modules/auth-context/domain/value-objects";
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

export interface ApiUser {
  id: string;
  tenant_id: string;
  identification_number: string;
  username: string;
  email: string;
}

export interface ApiTenant {
  id: string;
  name: string;
  status: "ACTIVE" | "SUSPENDED";
}

export interface ApiRole {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
}

export interface ApiPermission {
  id: string;
  tenant_id: string;
  resource: string;
  action: string;
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

export const mapUserApiToDomain = (input: ApiUser): User => ({
  id: toUserId(input.id),
  tenantId: toTenantId(input.tenant_id),
  identificationNumber: input.identification_number,
  username: input.username,
  email: input.email,
});

export const mapTenantApiToDomain = (input: ApiTenant): Tenant => ({
  id: toTenantId(input.id),
  name: input.name,
  status: input.status,
});

export const mapRoleApiToDomain = (input: ApiRole): Role => ({
  id: toRoleId(input.id),
  tenantId: toTenantId(input.tenant_id),
  name: input.name,
  description: input.description,
});

export const mapPermissionApiToDomain = (input: ApiPermission): Permission => ({
  id: toPermissionId(input.id),
  tenantId: toTenantId(input.tenant_id),
  resource: input.resource,
  action: input.action,
});
