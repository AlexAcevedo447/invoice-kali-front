import type { AuthContextRepositories } from "@modules/auth-context/infrastructure/createAuthContextHttpRepositories";
import { toTenantId } from "@modules/auth-context/domain/value-objects/TenantId";
import { toUserId } from "@modules/auth-context/domain/value-objects/UserId";

export type AuthContextService = {
  health: AuthContextRepositories["healthRepository"];
  auth: {
    login: (
      command: { tenantId: string; email: string; password: string },
      options?: Parameters<
        AuthContextRepositories["authRepository"]["login"]
      >[1],
    ) => ReturnType<AuthContextRepositories["authRepository"]["login"]>;
    authorize: (
      command: {
        tenantId: string;
        userId: string;
        resource: string;
        action: string;
      },
      options: Parameters<
        AuthContextRepositories["authRepository"]["authorize"]
      >[1],
    ) => ReturnType<AuthContextRepositories["authRepository"]["authorize"]>;
  };
  users: AuthContextRepositories["userRepository"];
  tenants: AuthContextRepositories["tenantRepository"];
  roles: AuthContextRepositories["roleRepository"];
  permissions: AuthContextRepositories["permissionRepository"];
  rbac: AuthContextRepositories["rbacRepository"];
};

export const createAuthContextService = (
  repositories: AuthContextRepositories,
): AuthContextService => {
  return {
    health: repositories.healthRepository,
    auth: {
      login: (command, options) =>
        repositories.authRepository.login(
          { ...command, tenantId: toTenantId(command.tenantId) },
          options,
        ),
      authorize: (command, options) =>
        repositories.authRepository.authorize(
          {
            ...command,
            tenantId: toTenantId(command.tenantId),
            userId: toUserId(command.userId),
          },
          options,
        ),
    },
    users: repositories.userRepository,
    tenants: repositories.tenantRepository,
    roles: repositories.roleRepository,
    permissions: repositories.permissionRepository,
    rbac: repositories.rbacRepository,
  };
};
