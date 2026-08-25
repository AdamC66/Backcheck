import { ApiError } from "@/lib/apiClient";

export function toErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}
