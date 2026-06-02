export class HttpError extends Error {
  public readonly name = "HttpError";
  public readonly status: number;
  public readonly statusText: string;

  constructor(status: number, statusText: string, message?: string) {
    super(message ?? `HTTP ${status}: ${statusText}`);
    this.status = status;
    this.statusText = statusText;
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}
