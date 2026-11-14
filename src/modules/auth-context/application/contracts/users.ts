import type { User } from "@modules/auth-context/domain/entities/User";

// La empresa la toma el servidor del token: no se envía tenant_id.
export interface CreateUserCommand {
  identificationNumber: string;
  username: string;
  email: string;
  password: string;
}

export interface GetUserByIdQuery {
  userId: string;
}

export interface GetUserByEmailQuery {
  email: string;
}

export interface UpdateUserCommand {
  userId: string;
  identificationNumber: string;
  username: string;
  email: string;
  /** Opcional: vacía u omitida conserva la contraseña actual. */
  password?: string;
}

export interface DeleteUserCommand {
  userId: string;
}

export type UserResult = User;
export type UserListResult = User[];
