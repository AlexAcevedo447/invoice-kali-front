import type {
  AuthRepository,
  HealthRepository,
  PermissionRepository,
  RbacRepository,
  RoleRepository,
  TenantRepository,
  UserRepository,
} from "@modules/auth-context/domain/repositories";
import type { HttpClient } from "../../../shared/infrastructure/http/HttpClient";
import { httpCore } from "../../../shared/infrastructure/http/httpCore";
import {
  HttpAuthRepository,
  HttpHealthRepository,
  HttpPermissionRepository,
  HttpRbacRepository,
  HttpRoleRepository,
  HttpTenantRepository,
  HttpUserRepository,
} from "./adapters";

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
