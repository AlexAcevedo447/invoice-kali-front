import type { AuthRepository } from "../domain/repositories/AuthRepository";
import type { HealthRepository } from "../domain/repositories/HealthRepository";
import type { PermissionRepository } from "../domain/repositories/PermissionRepository";
import type { RbacRepository } from "../domain/repositories/RbacRepository";
import type { RoleRepository } from "../domain/repositories/RoleRepository";
import type { TenantRepository } from "../domain/repositories/TenantRepository";
import type { UserRepository } from "../domain/repositories/UserRepository";
import type { HttpClient } from "../../../shared/infrastructure/http/HttpClient";
import { httpCore } from "../../../shared/infrastructure/http/httpCore";
import { HttpAuthRepository } from "./adapters/HttpAuthRepository";
import { HttpHealthRepository } from "./adapters/HttpHealthRepository";
import { HttpPermissionRepository } from "./adapters/HttpPermissionRepository";
import { HttpRbacRepository } from "./adapters/HttpRbacRepository";
import { HttpRoleRepository } from "./adapters/HttpRoleRepository";
import { HttpTenantRepository } from "./adapters/HttpTenantRepository";
import { HttpUserRepository } from "./adapters/HttpUserRepository";

export interface AuthContextRepositories {
  healthRepository: HealthRepository;
  authRepository: AuthRepository;
  userRepository: UserRepository;
  tenantRepository: TenantRepository;
  roleRepository: RoleRepository;
  permissionRepository: PermissionRepository;
  rbacRepository: RbacRepository;
}

export const createAuthContextHttpRepositories = (
  httpClient: HttpClient = httpCore,
): AuthContextRepositories => ({
  healthRepository: new HttpHealthRepository(httpClient),
  authRepository: new HttpAuthRepository(httpClient),
  userRepository: new HttpUserRepository(httpClient),
  tenantRepository: new HttpTenantRepository(httpClient),
  roleRepository: new HttpRoleRepository(httpClient),
  permissionRepository: new HttpPermissionRepository(httpClient),
  rbacRepository: new HttpRbacRepository(httpClient),
});
