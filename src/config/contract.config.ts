import { BaseError } from "viem";
import type { ContractError } from "../modals/api.model";

export function parseContractError(
  error: unknown,
  method?: string
): ContractError {
  const now = new Date().toISOString();

  if (error instanceof BaseError) {
    return {
      message: error.shortMessage || error.message,
      name: error.name,
      reason: error.walk()?.message,
      data: error.details || {},
      stack: error.stack,
      timestamp: now,
      method,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      timestamp: now,
      method,
    };
  }

  return {
    message: "Unknown contract error",
    timestamp: now,
    method,
  };
}
