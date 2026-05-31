import type { AuthSession } from "../../domain/entities/AuthSession";
import type { AuthorizationDecision } from "../../domain/entities/AuthorizationDecision";

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
