import type { Brand } from "@core/types/brand";

export type UserId = Brand<string, "UserId">;

export const toUserId = (value: string): UserId => value as UserId;
