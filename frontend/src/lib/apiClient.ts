import { readToken } from "@/lib/tokenStorage";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

interface ErrorBody {
  error?: { code?: string; message?: string };
}

export interface Envelope<T, M> {
  data: T;
  meta?: M;
}

// The API always answers with a `data` or `error` envelope, so unwrapping and error
// translation happen once here instead of in every hook (see docs/DECISIONS.md).
async function send<T, M>(path: string, init: RequestInit): Promise<Envelope<T, M>> {
  const token = readToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token === null ? {} : { Authorization: `Bearer ${token}` }),
      ...init.headers,
    },
  });

  if (response.status === 204) {
    return { data: undefined as T };
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (body as ErrorBody | null)?.error;
    throw new ApiError(
      error?.code ?? "unknown_error",
      error?.message ?? response.statusText,
      response.status,
    );
  }

  return body as Envelope<T, M>;
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await send<T, never>(path, init);

  return data;
}

// For the endpoints whose `meta` is part of the answer rather than pagination trivia —
// standings, for instance, report which season and date the rows describe.
export function requestWithMeta<T, M>(
  path: string,
  init: RequestInit = {},
): Promise<Envelope<T, M>> {
  return send<T, M>(path, init);
}
