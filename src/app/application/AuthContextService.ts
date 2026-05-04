import {
  ActivateTenantUseCase,
  AssignRolePermissionUseCase,
  AssignUserRoleUseCase,
  AuthorizeUseCase,
  CheckHealthUseCase,
  CreatePermissionUseCase,
  CreateRoleUseCase,
  CreateTenantUseCase,
  CreateUserUseCase,
  DeletePermissionUseCase,
  DeleteRoleUseCase,
  DeleteUserUseCase,
  GetPermissionByIdUseCase,
  GetRoleByIdUseCase,
  GetRolePermissionsUseCase,
  GetServiceRootStatusUseCase,
  GetTenantByIdUseCase,
  GetTenantByNameUseCase,
  GetUserByEmailUseCase,
  GetUserByIdUseCase,
  GetUserEffectivePermissionsUseCase,
  GetUserRolesUseCase,
  ListPermissionsUseCase,
  ListRolesUseCase,
  ListTenantsUseCase,
  ListUsersUseCase,
  LoginUseCase,
  RemoveRolePermissionUseCase,
  RemoveUserRoleUseCase,
  SuspendTenantUseCase,
  UpdatePermissionUseCase,
  UpdateRoleUseCase,
  UpdateTenantUseCase,
  UpdateUserUseCase,
  type AssignRolePermissionCommand,
  type AssignUserRoleCommand,
  type AuthorizeCommand,
  type AuthorizeResult,
  type ChangeTenantStatusCommand,
  type CreatePermissionCommand,
  type CreateRoleCommand,
  type CreateTenantCommand,
  type CreateUserCommand,
  type DeletePermissionCommand,
  type DeleteRoleCommand,
  type DeleteUserCommand,
  type GetPermissionByIdQuery,
  type GetRoleByIdQuery,
  type GetTenantByIdQuery,
  type GetTenantByNameQuery,
  type GetUserByEmailQuery,
  type GetUserByIdQuery,
  type IdempotentProtectedRequest,
  type ListPermissionsQuery,
  type ListRolesQuery,
  type ListUsersQuery,
  type LoginCommand,
  type LoginResult,
  type ProtectedRequest,
  type PublicRequest,
  type RemoveRolePermissionCommand,
  type RemoveUserRoleCommand,
  type RolePermissionsQuery,
  type RolePermissionsResult,
  type TenantListResult,
  type TenantResult,
  type UpdatePermissionCommand,
  type UpdateRoleCommand,
  type UpdateTenantCommand,
  type UpdateUserCommand,
  type UserEffectivePermissionsQuery,
  type UserEffectivePermissionsResult,
  type UserListResult,
  type UserRolesQuery,
  type UserRolesResult,
  type UserResult,
  type PermissionListResult,
  type PermissionResult,
  type RoleListResult,
  type RoleResult,
} from "@modules/auth-context/application";
import type { AuthContextRepositories } from "@modules/auth-context/infrastructure";
import type { ServiceHealth } from "@modules/auth-context/domain/entities";

export interface AuthContextService {
  health: {
    getRootStatus(options?: PublicRequest): Promise<ServiceHealth>;
    check(options?: PublicRequest): Promise<void>;
  };
  auth: {
    login(command: LoginCommand, options?: PublicRequest): Promise<LoginResult>;
    authorize(
      command: AuthorizeCommand,
      options: ProtectedRequest,
    ): Promise<AuthorizeResult>;
  };
  users: {
    create(
      command: CreateUserCommand,
      options: IdempotentProtectedRequest,
    ): Promise<void>;
    list(
      query: ListUsersQuery,
      options: ProtectedRequest,
    ): Promise<UserListResult>;
    getById(
      query: GetUserByIdQuery,
      options: ProtectedRequest,
    ): Promise<UserResult>;
    getByEmail(
      query: GetUserByEmailQuery,
      options: ProtectedRequest,
    ): Promise<UserResult>;
    update(
      command: UpdateUserCommand,
      options: IdempotentProtectedRequest,
    ): Promise<void>;
    delete(
      command: DeleteUserCommand,
      options: IdempotentProtectedRequest,
    ): Promise<void>;
  };
  tenants: {
    create(
      command: CreateTenantCommand,
      options: IdempotentProtectedRequest,
    ): Promise<void>;
    list(options: ProtectedRequest): Promise<TenantListResult>;
    getById(
      query: GetTenantByIdQuery,
      options: ProtectedRequest,
    ): Promise<TenantResult>;
    getByName(
      query: GetTenantByNameQuery,
      options: ProtectedRequest,
    ): Promise<TenantResult>;
    update(
      command: UpdateTenantCommand,
      options: IdempotentProtectedRequest,
    ): Promise<void>;
    activate(
      command: ChangeTenantStatusCommand,
      options: IdempotentProtectedRequest,
    ): Promise<void>;
    suspend(
      command: ChangeTenantStatusCommand,
      options: IdempotentProtectedRequest,
    ): Promise<void>;
  };
  roles: {
    create(
      command: CreateRoleCommand,
      options: IdempotentProtectedRequest,
    ): Promise<void>;
    list(
      query: ListRolesQuery,
      options: ProtectedRequest,
    ): Promise<RoleListResult>;
    getById(
      query: GetRoleByIdQuery,
      options: ProtectedRequest,
    ): Promise<RoleResult>;
    update(
      command: UpdateRoleCommand,
      options: IdempotentProtectedRequest,
    ): Promise<void>;
    delete(
      command: DeleteRoleCommand,
      options: IdempotentProtectedRequest,
    ): Promise<void>;
  };
  permissions: {
    create(
      command: CreatePermissionCommand,
      options: IdempotentProtectedRequest,
    ): Promise<void>;
    list(
      query: ListPermissionsQuery,
      options: ProtectedRequest,
    ): Promise<PermissionListResult>;
    getById(
      query: GetPermissionByIdQuery,
      options: ProtectedRequest,
    ): Promise<PermissionResult>;
    update(
      command: UpdatePermissionCommand,
      options: IdempotentProtectedRequest,
    ): Promise<void>;
    delete(
      command: DeletePermissionCommand,
      options: IdempotentProtectedRequest,
    ): Promise<void>;
  };
  rbac: {
    assignUserRole(
      command: AssignUserRoleCommand,
      options: IdempotentProtectedRequest,
    ): Promise<void>;
    removeUserRole(
      command: RemoveUserRoleCommand,
      options: ProtectedRequest,
    ): Promise<void>;
    assignRolePermission(
      command: AssignRolePermissionCommand,
      options: IdempotentProtectedRequest,
    ): Promise<void>;
    removeRolePermission(
      command: RemoveRolePermissionCommand,
      options: ProtectedRequest,
    ): Promise<void>;
    getUserRoles(
      query: UserRolesQuery,
      options: ProtectedRequest,
    ): Promise<UserRolesResult>;
    getRolePermissions(
      query: RolePermissionsQuery,
      options: ProtectedRequest,
    ): Promise<RolePermissionsResult>;
    getUserEffectivePermissions(
      query: UserEffectivePermissionsQuery,
      options: ProtectedRequest,
    ): Promise<UserEffectivePermissionsResult>;
  };
}

export const createAuthContextService = (
  repositories: AuthContextRepositories,
): AuthContextService => {
  const getServiceRootStatus = new GetServiceRootStatusUseCase(
    repositories.healthRepository,
  );
  const checkHealth = new CheckHealthUseCase(repositories.healthRepository);
  const login = new LoginUseCase(repositories.authRepository);
  const authorize = new AuthorizeUseCase(repositories.authRepository);

  const createUser = new CreateUserUseCase(repositories.userRepository);
  const listUsers = new ListUsersUseCase(repositories.userRepository);
  const getUserById = new GetUserByIdUseCase(repositories.userRepository);
  const getUserByEmail = new GetUserByEmailUseCase(repositories.userRepository);
  const updateUser = new UpdateUserUseCase(repositories.userRepository);
  const deleteUser = new DeleteUserUseCase(repositories.userRepository);

  const createTenant = new CreateTenantUseCase(repositories.tenantRepository);
  const listTenants = new ListTenantsUseCase(repositories.tenantRepository);
  const getTenantById = new GetTenantByIdUseCase(repositories.tenantRepository);
  const getTenantByName = new GetTenantByNameUseCase(
    repositories.tenantRepository,
  );
  const updateTenant = new UpdateTenantUseCase(repositories.tenantRepository);
  const activateTenant = new ActivateTenantUseCase(
    repositories.tenantRepository,
  );
  const suspendTenant = new SuspendTenantUseCase(repositories.tenantRepository);

  const createRole = new CreateRoleUseCase(repositories.roleRepository);
  const listRoles = new ListRolesUseCase(repositories.roleRepository);
  const getRoleById = new GetRoleByIdUseCase(repositories.roleRepository);
  const updateRole = new UpdateRoleUseCase(repositories.roleRepository);
  const deleteRole = new DeleteRoleUseCase(repositories.roleRepository);

  const createPermission = new CreatePermissionUseCase(
    repositories.permissionRepository,
  );
  const listPermissions = new ListPermissionsUseCase(
    repositories.permissionRepository,
  );
  const getPermissionById = new GetPermissionByIdUseCase(
    repositories.permissionRepository,
  );
  const updatePermission = new UpdatePermissionUseCase(
    repositories.permissionRepository,
  );
  const deletePermission = new DeletePermissionUseCase(
    repositories.permissionRepository,
  );

  const assignUserRole = new AssignUserRoleUseCase(repositories.rbacRepository);
  const removeUserRole = new RemoveUserRoleUseCase(repositories.rbacRepository);
  const assignRolePermission = new AssignRolePermissionUseCase(
    repositories.rbacRepository,
  );
  const removeRolePermission = new RemoveRolePermissionUseCase(
    repositories.rbacRepository,
  );
  const getUserRoles = new GetUserRolesUseCase(repositories.rbacRepository);
  const getRolePermissions = new GetRolePermissionsUseCase(
    repositories.rbacRepository,
  );
  const getUserEffectivePermissions = new GetUserEffectivePermissionsUseCase(
    repositories.rbacRepository,
  );

  return {
    health: {
      getRootStatus: (options) => getServiceRootStatus.execute(options),
      check: (options) => checkHealth.execute(options),
    },
    auth: {
      login: (command, options) => login.execute(command, options),
      authorize: (command, options) => authorize.execute(command, options),
    },
    users: {
      create: (command, options) => createUser.execute(command, options),
      list: (query, options) => listUsers.execute(query, options),
      getById: (query, options) => getUserById.execute(query, options),
      getByEmail: (query, options) => getUserByEmail.execute(query, options),
      update: (command, options) => updateUser.execute(command, options),
      delete: (command, options) => deleteUser.execute(command, options),
    },
    tenants: {
      create: (command, options) => createTenant.execute(command, options),
      list: (options) => listTenants.execute(options),
      getById: (query, options) => getTenantById.execute(query, options),
      getByName: (query, options) => getTenantByName.execute(query, options),
      update: (command, options) => updateTenant.execute(command, options),
      activate: (command, options) => activateTenant.execute(command, options),
      suspend: (command, options) => suspendTenant.execute(command, options),
    },
    roles: {
      create: (command, options) => createRole.execute(command, options),
      list: (query, options) => listRoles.execute(query, options),
      getById: (query, options) => getRoleById.execute(query, options),
      update: (command, options) => updateRole.execute(command, options),
      delete: (command, options) => deleteRole.execute(command, options),
    },
    permissions: {
      create: (command, options) => createPermission.execute(command, options),
      list: (query, options) => listPermissions.execute(query, options),
      getById: (query, options) => getPermissionById.execute(query, options),
      update: (command, options) => updatePermission.execute(command, options),
      delete: (command, options) => deletePermission.execute(command, options),
    },
    rbac: {
      assignUserRole: (command, options) =>
        assignUserRole.execute(command, options),
      removeUserRole: (command, options) =>
        removeUserRole.execute(command, options),
      assignRolePermission: (command, options) =>
        assignRolePermission.execute(command, options),
      removeRolePermission: (command, options) =>
        removeRolePermission.execute(command, options),
      getUserRoles: (query, options) => getUserRoles.execute(query, options),
      getRolePermissions: (query, options) =>
        getRolePermissions.execute(query, options),
      getUserEffectivePermissions: (query, options) =>
        getUserEffectivePermissions.execute(query, options),
    },
  };
};
