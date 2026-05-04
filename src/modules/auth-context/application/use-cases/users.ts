import type {
  CreateUserCommand,
  DeleteUserCommand,
  GetUserByEmailQuery,
  GetUserByIdQuery,
  IdempotentProtectedRequest,
  ListUsersQuery,
  ProtectedRequest,
  UpdateUserCommand,
  UserListResult,
  UserResult,
} from "@modules/auth-context/application/contracts";
import type { UserRepository } from "@modules/auth-context/domain/repositories/UserRepository";
import { toTenantId, toUserId } from "@modules/auth-context/domain/value-objects";

export class CreateUserUseCase {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  execute(command: CreateUserCommand, options: IdempotentProtectedRequest): Promise<void> {
    return this.userRepository.create(
      {
        tenantId: toTenantId(command.tenantId),
        identificationNumber: command.identificationNumber,
        username: command.username,
        email: command.email,
        password: command.password,
      },
      options,
    );
  }
}

export class ListUsersUseCase {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  execute(query: ListUsersQuery, options: ProtectedRequest): Promise<UserListResult> {
    return this.userRepository.list(
      {
        tenantId: toTenantId(query.tenantId),
      },
      options,
    );
  }
}

export class GetUserByIdUseCase {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  execute(query: GetUserByIdQuery, options: ProtectedRequest): Promise<UserResult> {
    return this.userRepository.getById(
      {
        userId: toUserId(query.userId),
        tenantId: toTenantId(query.tenantId),
      },
      options,
    );
  }
}

export class GetUserByEmailUseCase {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  execute(
    query: GetUserByEmailQuery,
    options: ProtectedRequest,
  ): Promise<UserResult> {
    return this.userRepository.getByEmail(
      {
        tenantId: toTenantId(query.tenantId),
        email: query.email,
      },
      options,
    );
  }
}

export class UpdateUserUseCase {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  execute(command: UpdateUserCommand, options: IdempotentProtectedRequest): Promise<void> {
    return this.userRepository.update(
      {
        userId: toUserId(command.userId),
        tenantId: toTenantId(command.tenantId),
        identificationNumber: command.identificationNumber,
        username: command.username,
        email: command.email,
        password: command.password,
      },
      options,
    );
  }
}

export class DeleteUserUseCase {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  execute(command: DeleteUserCommand, options: IdempotentProtectedRequest): Promise<void> {
    return this.userRepository.delete(
      {
        userId: toUserId(command.userId),
        tenantId: toTenantId(command.tenantId),
      },
      options,
    );
  }
}
