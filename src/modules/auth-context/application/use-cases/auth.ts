import type {
  AuthorizeCommand,
  AuthorizeResult,
  LoginCommand,
  LoginResult,
  ProtectedRequest,
  PublicRequest,
} from "@modules/auth-context/application/contracts";
import type { AuthRepository } from "@modules/auth-context/domain/repositories/AuthRepository";
import { toTenantId, toUserId } from "@modules/auth-context/domain/value-objects";

export class LoginUseCase {
  private readonly authRepository: AuthRepository;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
  }

  execute(command: LoginCommand, options?: PublicRequest): Promise<LoginResult> {
    return this.authRepository.login(
      {
        tenantId: toTenantId(command.tenantId),
        email: command.email,
        password: command.password,
      },
      options,
    );
  }
}

export class AuthorizeUseCase {
  private readonly authRepository: AuthRepository;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
  }

  execute(
    command: AuthorizeCommand,
    options: ProtectedRequest,
  ): Promise<AuthorizeResult> {
    return this.authRepository.authorize(
      {
        tenantId: toTenantId(command.tenantId),
        userId: toUserId(command.userId),
        resource: command.resource,
        action: command.action,
      },
      options,
    );
  }
}
