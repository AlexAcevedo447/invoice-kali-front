import type {
  AuthorizationDecision,
  AuthSession,
} from "@modules/auth-context/domain/entities";

export interface LoginCommand {
  tenantId: string;
  email: string;
  password: string;
}

export interface AuthorizeCommand {
  tenantId: string;
  userId: string;
  resource: string;
  action: string;
}

export type LoginResult = AuthSession;
export type AuthorizeResult = AuthorizationDecision;
