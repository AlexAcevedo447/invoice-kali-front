import type { User } from "@modules/auth-context/domain/entities/User";
import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
} from "@modules/auth-context/domain/repositories/RequestOptions";
import type { UserId } from "../value-objects/UserId";

/**
 * Usuarios de la empresa de la sesión (RF-04). La empresa la toma el servidor
 * del token, así que no se envía tenant_id. Las respuestas nunca incluyen la
 * contraseña ni su hash.
 */
export interface UserRepository {
  /** POST /users: devuelve el usuario creado. */
  create(
    command: {
      identificationNumber: string;
      username: string;
      email: string;
      password: string;
    },
    options: IdempotentProtectedRequestOptions,
  ): Promise<User>;

  list(options: ProtectedRequestOptions): Promise<User[]>;

  getById(query: { userId: UserId }, options: ProtectedRequestOptions): Promise<User>;

  getByEmail(query: { email: string }, options: ProtectedRequestOptions): Promise<User>;

  /** PUT /users/:id. Sin `password` (o vacía) el servidor conserva la actual. */
  update(
    command: {
      userId: UserId;
      identificationNumber: string;
      username: string;
      email: string;
      password?: string;
    },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;

  delete(command: { userId: UserId }, options: IdempotentProtectedRequestOptions): Promise<void>;
}
