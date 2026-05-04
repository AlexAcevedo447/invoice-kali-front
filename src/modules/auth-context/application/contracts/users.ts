import type { User } from "@modules/auth-context/domain/entities/User";

export interface CreateUserCommand {
  tenantId: string;
  identificationNumber: string;
  username: string;
  email: string;
  password: string;
}

export interface ListUsersQuery {
  tenantId: string;
}

export interface GetUserByIdQuery {
  userId: string;
  tenantId: string;
}

export interface GetUserByEmailQuery {
  tenantId: string;
  email: string;
}

export interface UpdateUserCommand {
  userId: string;
  tenantId: string;
  identificationNumber: string;
  username: string;
  email: string;
  password: string;
}

export interface DeleteUserCommand {
  userId: string;
  tenantId: string;
}

export type UserResult = User;
export type UserListResult = User[];
