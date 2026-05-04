import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
  RequestOptions,
} from "@modules/auth-context/domain/repositories/RequestOptions";

export type PublicRequest = RequestOptions;
export type ProtectedRequest = ProtectedRequestOptions;
export type IdempotentProtectedRequest = IdempotentProtectedRequestOptions;
