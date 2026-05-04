export interface RequestOptions {
  signal?: AbortSignal;
}

export interface ProtectedRequestOptions extends RequestOptions {
  accessToken: string;
}

export interface IdempotentProtectedRequestOptions extends ProtectedRequestOptions {
  idempotencyKey: string;
}
