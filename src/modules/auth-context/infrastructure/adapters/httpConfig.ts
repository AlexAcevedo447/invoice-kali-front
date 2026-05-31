import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
  RequestOptions,
} from "../../domain/repositories/RequestOptions";
import type { HttpRequestConfig } from "../../../../shared/infrastructure/http/HttpClient";

const toAuthorizationHeader = (accessToken: string): string =>
  `Bearer ${accessToken}`;

export const toPublicConfig = (
  options?: RequestOptions,
): HttpRequestConfig | undefined => {
  if (!options) {
    return undefined;
  }

  return {
    signal: options.signal,
  };
};

export const toProtectedConfig = (
  options: ProtectedRequestOptions,
): HttpRequestConfig => ({
  signal: options.signal,
  headers: {
    Authorization: toAuthorizationHeader(options.accessToken),
  },
});

export const toIdempotentProtectedConfig = (
  options: IdempotentProtectedRequestOptions,
): HttpRequestConfig => ({
  ...toProtectedConfig(options),
  idempotencyKey: options.idempotencyKey,
});
