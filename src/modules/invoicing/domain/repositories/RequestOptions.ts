export interface RequestOptions {
  signal?: AbortSignal;
}

export interface IdempotentRequestOptions extends RequestOptions {
  idempotencyKey: string;
}
